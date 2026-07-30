"use client"
import React from 'react'
import { useParams } from 'next/navigation'
import PrintInvoice from '../../../components/PrintInvoice'

export default function PrintInvoicePage() {
  const params = useParams()
  const billId = typeof params?.id === 'string' ? params.id : Array.isArray(params?.id) ? params.id[0] : ''

  return <PrintInvoice billId={billId} />
}
