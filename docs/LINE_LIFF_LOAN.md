# LINE LIFF — ขอสินเชื่อ

## สิ่งที่ต้องตั้งใน LINE Developers

1. สร้าง / ใช้ **LINE Login** channel (หรือ LIFF บน Messaging API channel ตามที่ LINE อนุญาต)
2. เพิ่ม LIFF app:
   - **Size:** Full
   - **Endpoint URL:** `https://<farmer-host>/line`
   - คัดลอก **LIFF ID**
3. Rich menu / Flex ปุ่ม URI ชี้ไป:
   - `https://liff.line.me/<LIFF_ID>`
   - หรือ `https://liff.line.me/<LIFF_ID>/loans` (ถ้าตั้ง path เพิ่ม — ค่าเริ่มต้นใช้ endpoint `/line` แล้ว redirect ไป `/loans`)

## Env

### Farmer app (`refactor-dona-application`)

```bash
NEXT_PUBLIC_LIFF_ID=<LIFF_ID>
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
DONA_API_URL=https://api.example.com
```

สร้าง Storage bucket ชื่อ `loan-documents` (แนะนำ private; route อัปโหลดใช้ service/anon key ฝั่งเซิร์ฟเวอร์)

### API (`refactor-dona-api`)

```bash
LINE_LOGIN_CHANNEL_ID=<Channel ID ของ LINE Login / LIFF channel>
```

รัน migration `000008_farmer_line_user_id`.

## Flow

1. เกษตรกรกดปุ่มใน LINE → เปิด LIFF `/line`
2. อนุญาต LINE Login → API `POST /auth/line`
3. ครั้งแรก: `/line/link` กรอกเบอร์ → `POST /auth/line/link`
4. ครั้งถัดไป: ได้ JWT ทันที → `/loans`
5. ยื่นคำขอ + อัปโหลดเอกสาร → เห็นใน mill ที่ `/loans/pending`
