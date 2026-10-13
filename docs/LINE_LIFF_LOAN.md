# LINE-first auth (farmer app)

เปิดจาก LINE → ล็อกอินอัตโนมัติ ไม่ถามเบอร์ทุกครั้ง

- คนใหม่: กด「เริ่มใช้งานด้วย LINE」→ สร้างบัญชีจากโปรไฟล์ LINE
- คนที่โรงสีลงทะเบียนไว้แล้ว: กด「ผูกเบอร์เดิม」ครั้งเดียว
- นอก LINE: ยังใช้ `/login` ด้วยเบอร์ได้

Env: `NEXT_PUBLIC_LIFF_ID`  
รายละเอียด API: `refactor-dona-api/docs/LINE_LIFF_LOAN.md`

## Railway / production

- `NEXT_PUBLIC_LIFF_ID` ต้องมีตอน **build** แล้ว **Redeploy** — ใส่ทีหลังไม่เข้า bundle
- `DONA_API_URL` ใน `next.config` rewrite ก็ bake ตอน build เช่นกัน
- LIFF Endpoint ใน LINE Console = `https://<โดเมน Railway แอปเกษตรกร>/line`
- เปิดจากเมนูด้วย `https://liff.line.me/<LIFF_ID>` ไม่ใช่เปิดโดเมน Railway เปล่าๆ
- `channel not found` = LIFF ID / ช่อง LINE Login ไม่ตรง (ไม่ใช่บั๊ก Railway)
