# LINE LIFF — ขอสินเชื่อบนเว็บ

อัปโหลดเอกสารทำบนเว็บใน LINE (LIFF) เท่านั้น

## Flow

1. Rich menu ชี้ไป `https://liff.line.me/<LIFF_ID>`  
   (Endpoint URL ของ LIFF = `https://<farmer-host>/line`)
2. ครั้งแรก: ผูกเบอร์ที่ `/line/link`
3. เข้า `/loans` → ขอสินเชื่อ → แนบเอกสารบนหน้าเว็บ
4. โรงสีตรวจที่ mill `/loans/pending`

## Env

```bash
NEXT_PUBLIC_LIFF_ID=<LIFF ID>
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
# bucket: loan-documents
```

API ต้องมี `LINE_LOGIN_CHANNEL_ID` และ migration `000008_farmer_line_user_id`
