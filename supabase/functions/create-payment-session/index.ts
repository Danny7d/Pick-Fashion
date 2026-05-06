// ============================================================================
// Edge Function: create-payment-session
// Initialize Chapa payment and create pending order
// ============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { 
      items,           // Array of cart items [{product_id, name, quantity, unit_price}]
      total_amount,    // Total order amount
      phone_number,    // Customer phone
      telegram_handle, // Customer telegram
      payment_method,  // 'chapa' or 'telebirr'
      return_url       // URL to redirect after payment
    } = await req.json();

    // Validate required fields
    if (!items?.length || !total_amount || !phone_number || !telegram_handle || !payment_method) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client with service role key
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get user from JWT
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

    // Generate unique transaction reference
    const txRef = `PF-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Create order
    const { data: order, error: orderError } = await supabaseClient
      .from("orders")
      .insert({
        user_id: user.id,
        total_amount: total_amount,
        status: "pending",
        phone_number: phone_number,
        telegram_handle: telegram_handle,
        payment_method: payment_method
      })
      .select()
      .single();

    if (orderError) {
      console.error("Order creation failed:", orderError);
      return new Response(
        JSON.stringify({ error: "Failed to create order" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create order items
    const orderItems = items.map(item => ({
      order_id: order.id,
      product_id: item.product_id,
      product_name: item.name,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: item.quantity * item.unit_price
    }));

    const { error: itemsError } = await supabaseClient
      .from("order_items")
      .insert(orderItems);

    if (itemsError) {
      console.error("Order items creation failed:", itemsError);
      // Continue anyway, order is created
    }

    // Handle Chapa Payment
    if (payment_method === "chapa") {
      const chapaSecret = Deno.env.get("CHAPA_SECRET_KEY");
      if (!chapaSecret) {
        return new Response(
          JSON.stringify({ error: "Chapa not configured" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Initialize Chapa payment
      const chapaResponse = await fetch("https://api.chapa.co/v1/transaction/initialize", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${chapaSecret}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          amount: total_amount.toString(),
          currency: "ETB",
          email: user.email || "customer@pickfashion.com",
          first_name: telegram_handle.split("_")[0] || "Customer",
          last_name: telegram_handle.split("_")[1] || "",
          tx_ref: txRef,
          callback_url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/chapa-webhook`,
          return_url: return_url || `${Deno.env.get("SITE_URL")}/payment-success?order=${order.id}`,
          customization: {
            title: "Pick Fashion",
            description: `Order #${order.id.slice(0, 8)}`
          }
        })
      });

      const chapaData = await chapaResponse.json();

      if (!chapaResponse.ok) {
        console.error("Chapa initialization failed:", chapaData);
        return new Response(
          JSON.stringify({ error: "Payment initialization failed", details: chapaData }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Create payment record
      const { error: paymentError } = await supabaseClient
        .from("payments")
        .insert({
          order_id: order.id,
          provider: "chapa",
          transaction_ref: txRef,
          status: "pending",
          chapa_response: chapaData
        });

      if (paymentError) {
        console.error("Payment record creation failed:", paymentError);
      }

      return new Response(
        JSON.stringify({
          success: true,
          order_id: order.id,
          checkout_url: chapaData.data?.checkout_url,
          transaction_ref: txRef
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Handle Telebirr Payment (MVP Version - Manual Reference)
    if (payment_method === "telebirr") {
      // Create payment record with manual reference
      const { error: paymentError } = await supabaseClient
        .from("payments")
        .insert({
          order_id: order.id,
          provider: "telebirr",
          transaction_ref: txRef,
          status: "pending",
          telebirr_response: {
            reference: txRef,
            instructions: "Complete payment via Telebirr app using this reference",
            phone_number: "+251913950321" // Your business number
          }
        });

      if (paymentError) {
        console.error("Payment record creation failed:", paymentError);
      }

      return new Response(
        JSON.stringify({
          success: true,
          order_id: order.id,
          transaction_ref: txRef,
          instructions: {
            step1: "Open Telebirr app on your phone",
            step2: `Send ${total_amount} ETB to +251 913 950 321`,
            step3: `Use reference: ${txRef}`,
            step4: "Contact us on Telegram @Rutha_5 with screenshot",
            reference: txRef
          }
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid payment method" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
