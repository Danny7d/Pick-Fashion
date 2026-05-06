// ============================================================================
// Edge Function: chapa-webhook
// Handle Chapa payment confirmation webhook
// ============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Only accept POST requests
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const payload = await req.json();
    console.log("Chapa webhook received:", payload);

    // Extract data from Chapa webhook
    const { 
      tx_ref,           // Transaction reference
      status,           // Payment status
      amount,
      currency,
      charge,
      mode,
      type,
      reference
    } = payload;

    // Validate webhook data
    if (!tx_ref || !status) {
      return new Response(
        JSON.stringify({ error: "Invalid webhook payload" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client with service role
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Find payment by transaction reference
    const { data: payment, error: paymentError } = await supabaseClient
      .from("payments")
      .select("*, orders(*)")
      .eq("transaction_ref", tx_ref)
      .single();

    if (paymentError || !payment) {
      console.error("Payment not found:", tx_ref, paymentError);
      return new Response(
        JSON.stringify({ error: "Payment not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Prevent duplicate processing
    if (payment.status === "success") {
      console.log("Payment already processed:", tx_ref);
      return new Response(
        JSON.stringify({ message: "Already processed" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Determine payment status
    const isSuccess = status === "success";
    const newStatus = isSuccess ? "success" : "failed";

    // Update payment record
    const { error: updateError } = await supabaseClient
      .from("payments")
      .update({
        status: newStatus,
        chapa_response: payload,
        verified_at: new Date().toISOString()
      })
      .eq("id", payment.id);

    if (updateError) {
      console.error("Payment update failed:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to update payment" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update order status
    const orderStatus = isSuccess ? "paid" : "failed";
    const { error: orderUpdateError } = await supabaseClient
      .from("orders")
      .update({ status: orderStatus })
      .eq("id", payment.order_id);

    if (orderUpdateError) {
      console.error("Order update failed:", orderUpdateError);
    }

    // Optional: Send notification to admin
    if (isSuccess) {
      try {
        // You could integrate with Telegram Bot API here
        // to notify admin of successful payment
        console.log("Payment successful for order:", payment.order_id);
      } catch (notifyError) {
        console.error("Notification failed:", notifyError);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Payment ${newStatus}`,
        order_id: payment.order_id 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Webhook processing error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
