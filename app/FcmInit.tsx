'use client';

import { useFcm } from '@/lib/useFcm';

export default function FcmInit() {
  useFcm();
  return null;
}