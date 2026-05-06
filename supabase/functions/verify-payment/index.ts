// ============================================================================
// Edge Function: verify-payment
// Manual verification endpoint for Telebirr or re-checking Chapa status
// ============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { order_id } = await req.json();

    if (!order_id) {
      return new Response(
        JSON.stringify({ error: "Order ID required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client with user auth
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { 
        auth: { 
          persistSession: false,
          autoRefreshToken: false
        } 
      }
    );

    // Get auth from request
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const jwt = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(jwt);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get order with payment (user can only see their own due to RLS)
    const { data: order, error: orderError } = await supabaseClient
      .from("orders")
      .select("*, payments(*)")
      .eq("id", order_id)
      .eq("user_id", user.id)
      .single();

    if (orderError || !order) {
      return new Response(
        JSON.stringify({ error: "Order not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // If Chapa payment, optionally verify with Chapa API
    if (order.payment_method === "chapa" && order.payments?.[0]?.status === "pending") {
      const chapaSecret = Deno.env.get("CHAPA_SECRET_KEY");
      const txRef = order.payments[0].transaction_ref;

      if (chapaSecret && txRef) {
        try {
          const verifyResponse = await fetch(
            `https://api.chapa.co/v1/transaction/verify/${txRef}`,
            {
              headers: {
                "Authorization": `Bearer ${chapaSecret}`
              }
            }
          );

          const verifyData = await verifyResponse.json();

          if (verifyResponse.ok && verifyData.data?.status === "success") {
            // Update payment status using service role client
            const adminClient = createClient(
              Deno.env.get("SUPABASE_URL") ?? "",
              Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
              { auth: { persistSession: false } }
            );

            await adminClient
              .from("payments")
              .update({ 
                status: "success", 
                chapa_response: verifyData,
                verified_at: new Date().toISOString()
              })
              .eq("id", order.payments[0].id);

            await adminClient
              .from("orders")
              .update({ status: "paid" })
              .eq("id", order.id);

            order.status = "paid";
            order.payments[0].status = "success";
          }
        } catch (verifyError) {
          console.error("Chapa verification failed:", verifyError);
        }
      }
    }

    return new Response(
      JSON.stringify({
        order_id: order.id,
        status: order.status,
        payment_status: order.payments?.[0]?.status || "unknown",
        amount: order.total_amount,
        payment_method: order.payment_method,
        created_at: order.created_at
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Verification error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
