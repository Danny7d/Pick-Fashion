import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import {
  getFallbackProducts,
  normalizeSupabaseProduct,
} from "./productUtils";

export function useCatalogProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [usingFallback, setUsingFallback] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadProducts = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("products")
        .select(
          "id, name, description, category, price, stock, sold_count, image_url, status, created_at, updated_at",
        )
        .eq("status", "active")
        .gt("stock", 0)
        .order("created_at", { ascending: false });

      if (!cancelled) {
        if (error || !data?.length) {
          setProducts(getFallbackProducts());
          setUsingFallback(true);
        } else {
          setProducts(data.map(normalizeSupabaseProduct));
          setUsingFallback(false);
        }
        setLoading(false);
      }
    };

    loadProducts();

    return () => {
      cancelled = true;
    };
  }, []);

  return { products, loading, usingFallback };
}
