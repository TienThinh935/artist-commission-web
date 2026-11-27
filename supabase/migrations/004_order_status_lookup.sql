-- 004_order_status_lookup.sql
-- Secure RPC function allowing a customer to check ONLY their own order status
-- by providing BOTH their exact order_code AND customer_email.
-- Never exposes internal notes, reference images, or other customers' records.

CREATE OR REPLACE FUNCTION public.lookup_commission_status(
  p_order_code TEXT,
  p_email TEXT
)
RETURNS TABLE (
  order_code TEXT,
  commission_type_name TEXT,
  character_count INTEGER,
  status TEXT,
  estimated_price NUMERIC(12, 2),
  final_quoted_price NUMERIC(12, 2),
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    o.order_code,
    o.commission_type_name,
    o.character_count,
    o.status,
    o.estimated_price,
    o.final_quoted_price,
    o.created_at,
    o.updated_at
  FROM public.commission_orders o
  WHERE UPPER(TRIM(o.order_code)) = UPPER(TRIM(p_order_code))
    AND LOWER(TRIM(o.customer_email)) = LOWER(TRIM(p_email))
  LIMIT 1;
END;
$$;

GRANT EXECUTE ON FUNCTION public.lookup_commission_status(TEXT, TEXT) TO anon, authenticated;
