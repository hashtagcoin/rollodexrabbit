-- Fix for the "column category of relation claims does not exist" error
-- This migration creates a new function without any problematic category column references

-- Create a new function that correctly handles both service_bookings and claims tables
CREATE OR REPLACE FUNCTION book_service_fixed(
  p_user_id UUID,
  p_service_id UUID,
  p_scheduled_at TIMESTAMP WITH TIME ZONE,
  p_total_price DECIMAL,
  p_ndis_covered_amount DECIMAL,
  p_gap_payment DECIMAL,
  p_notes TEXT,
  p_category TEXT
)
RETURNS UUID AS $$
DECLARE
  v_wallet_record RECORD;
  v_category_balance DECIMAL;
  v_booking_id UUID;
BEGIN
  -- Get wallet data
  SELECT * INTO v_wallet_record FROM wallets WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Wallet not found for user';
  END IF;
  
  -- Check category balance
  v_category_balance := (v_wallet_record.category_breakdown->p_category)::DECIMAL;
  
  IF v_category_balance IS NULL OR v_category_balance < p_ndis_covered_amount THEN
    RAISE EXCEPTION 'Insufficient funds in % category. Available: %', p_category, COALESCE(v_category_balance, 0);
  END IF;
  
  -- Create booking (without category)
  INSERT INTO service_bookings (
    user_id,
    service_id,
    scheduled_at,
    total_price,
    ndis_covered_amount,
    gap_payment,
    notes,
    status
  ) VALUES (
    p_user_id,
    p_service_id,
    p_scheduled_at,
    p_total_price,
    p_ndis_covered_amount,
    p_gap_payment,
    p_notes,
    'pending'
  ) RETURNING id INTO v_booking_id;
  
  -- Update wallet balance
  UPDATE wallets
  SET 
    total_balance = total_balance - p_ndis_covered_amount,
    category_breakdown = jsonb_set(
      category_breakdown,
      ARRAY[p_category],
      to_jsonb(v_category_balance - p_ndis_covered_amount)
    )
  WHERE user_id = p_user_id;
  
  -- Create claim record (without category)
  INSERT INTO claims (
    user_id,
    booking_id,
    amount,
    status,
    expiry_date
  ) VALUES (
    p_user_id,
    v_booking_id,
    p_ndis_covered_amount,
    'pending',
    NOW() + INTERVAL '90 days'
  );
  
  RETURN v_booking_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION book_service_fixed TO authenticated, service_role;
