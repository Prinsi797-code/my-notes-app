import { useEffect, useState } from 'react';
import PurchaseManager from '../services/purchaseManager';

/**
 * usePremium hook
 * 
 * Kisi bhi screen me use karo:
 * const { isPremium, loading } = usePremium();
 * 
 * isPremium === true hoto ads mat dikhao
 */
export function usePremium() {
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkPremium();
  }, []);

  const checkPremium = async () => {
    try {
      const status = await PurchaseManager.isPremium();
      setIsPremium(status);
    } catch {
      setIsPremium(false);
    } finally {
      setLoading(false);
    }
  };

  const refresh = () => {
    setLoading(true);
    checkPremium();
  };

  return { isPremium, loading, refresh };
}