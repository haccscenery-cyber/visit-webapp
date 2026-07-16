# ระบบรายงานยอดลูกค้าฟาร์มและรีสอร์ท

เว็บแอปสำหรับบันทึกยอดคนเข้าชมฟาร์มและลูกค้าเข้าพัก โดยแผนกต้อนรับกรอกยอดผู้เข้าพักก่อน แล้วแผนกบัญชีกรอกยอดฟาร์ม ตรวจสอบ ส่งรายงานเข้ากลุ่ม LINE และส่งออก Excel/PDF ได้

## สิ่งที่มีในโปรเจกต์

- หน้า dashboard responsive จากต้นแบบ Stitch พร้อมโหมดสาธิต
- หน้าเข้าสู่ระบบด้วย Supabase Auth และสิทธิ์ 3 บทบาท: `receptionist`, `accountant`, `admin`
- บันทึกยอด 11 รายการผ่าน Supabase RPC ที่ตรวจสิทธิ์ฝั่งฐานข้อมูล
- สรุปยอดฟาร์ม ลูกค้าเข้าพัก ยอดรวม และยอดสะสมประจำเดือน
- ส่งออก CSV ที่เปิดด้วย Excel ได้ และสั่งพิมพ์หน้าเป็น PDF
- Cloudflare Pages Function สำหรับตรวจสิทธิ์และส่ง LINE Flex Message
- Pages Function กับ Cloudflare Worker Cron สำหรับแจ้งเตือนรายงานค้างส่ง

## โครงสร้างไฟล์

```text
assets/                 หน้าเว็บ, CSS และ JavaScript
functions/api/          Cloudflare Pages Functions
supabase/schema.sql     ตาราง, RLS และฟังก์ชันของ Supabase
worker/                 Cloudflare Worker สำหรับตั้งเวลาแจ้งเตือน
wrangler.jsonc          การตั้งค่า Cloudflare Pages
```

## เริ่มใช้งานในเครื่อง

1. คัดลอก `.dev.vars.example` เป็น `.dev.vars` และใส่ค่าทดสอบของ Supabase/LINE หากต้องการทดสอบ Function
2. เปิด `assets/js/config.js` แล้วใส่ `supabaseUrl` และ `supabasePublishableKey` สำหรับให้หน้าเว็บเชื่อม Supabase
3. ติดตั้ง Wrangler หรือสั่ง `npx wrangler pages dev .`
4. เปิด URL ที่ Wrangler แสดงในเบราว์เซอร์

หากยังไม่ใส่ค่า Supabase หน้าเว็บจะเปิดเป็นโหมดสาธิตโดยอัตโนมัติ

## ตั้งค่า Supabase

1. สร้าง Supabase project ใหม่
2. ไปที่ `SQL Editor` แล้วรันไฟล์ [schema.sql](supabase/schema.sql) ทั้งไฟล์
3. ไปที่ `Authentication > Providers` เปิดใช้งาน Email provider
4. สร้างบัญชีผู้ใช้ใน `Authentication > Users` อย่างน้อย 3 บัญชีสำหรับผู้ดูแลระบบ บัญชี และต้อนรับ
5. หลังสร้างบัญชี ให้คัดลอก UUID ของผู้ดูแลระบบ แล้วรันคำสั่งนี้ใน SQL Editor:

```sql
update public.profiles
set role = 'admin', display_name = 'ชื่อผู้ดูแลระบบ'
where id = 'AUTH_USER_UUID';
```

6. เปลี่ยน role ของผู้ใช้อื่นเป็น `accountant` หรือ `receptionist` ตามหน้าที่
7. ใน `Authentication > URL Configuration` เพิ่ม URL ของ Cloudflare Pages เช่น `https://visit-webapp.pages.dev` และ URL สำหรับทดสอบในเครื่อง
8. คัดลอก `Project URL` กับ `publishable key` จาก `Settings > API Keys` ไปใส่ใน `assets/js/config.js`

`publishable key` ใช้ในหน้าเว็บได้ เพราะ schema เปิด Row Level Security และใช้ policy/RPC ควบคุมสิทธิ์แล้ว ห้ามนำ `secret key` ไปใส่ใน `assets/js/config.js` หรือ commit ลง Git เด็ดขาด

## ตั้งค่า LINE

1. สร้าง Messaging API channel ใน LINE Developers และเพิ่ม LINE Official Account เข้ากลุ่มเป้าหมาย
2. หลัง deploy Cloudflare Pages แล้ว ตั้ง Webhook URL ชั่วคราวเป็น `https://YOUR_PAGES_DOMAIN/api/line-webhook`
3. ส่งข้อความหนึ่งข้อความในกลุ่ม LINE เป้าหมาย แล้วเปิด Cloudflare Pages Function logs เพื่อดูค่า `line_group_id`
4. นำ Group ID นี้ไปบันทึกเป็น secret ชื่อ `LINE_GROUP_ID`
5. ใส่ Channel access token เป็น secret `LINE_CHANNEL_ACCESS_TOKEN` และ Channel secret เป็น secret `LINE_CHANNEL_SECRET`
6. กด Verify ใน LINE Developers เพื่อยืนยัน webhook แล้วปิด webhook ได้หากไม่ต้องใช้งานต่อ

LINE จะส่งรายงานผ่าน `POST /v2/bot/message/push` และบอทต้องเป็นสมาชิกของกลุ่ม LINE เป้าหมายก่อน

## Deploy ไป GitHub

จากโฟลเดอร์โปรเจกต์นี้ ให้รันคำสั่งต่อไปนี้หลังล็อกอิน GitHub ในเครื่องแล้ว:

```powershell
git init
git add .
git commit -m "Initial farm and resort reporting web app"
git branch -M main
git remote add origin https://github.com/haccscenery-cyber/visit-webapp.git
git push -u origin main
```

หากรีโพมีไฟล์อยู่แล้ว ให้ clone รีโพนั้นก่อนหรือ pull ข้อมูลมาก่อน เพื่อรวมประวัติอย่างปลอดภัย แล้วจึงคัดลอกไฟล์โปรเจกต์นี้เข้าไป commit

## Deploy ไป Cloudflare Pages

1. ไปที่ Cloudflare Dashboard > `Workers & Pages` > `Create application` > `Pages` > `Connect to Git`
2. เลือกรีโพ `haccscenery-cyber/visit-webapp` และ branch `main`
3. ตั้งค่า Build configuration ดังนี้

| ค่า | ค่าที่ใช้ |
| --- | --- |
| Framework preset | None |
| Build command | เว้นว่าง |
| Build output directory | `.` |
| Root directory | เว้นว่าง |

4. ใน `Settings > Variables and Secrets` ตั้งค่า Production และ Preview ตามตารางนี้

| ชื่อ | ประเภท | ค่า |
| --- | --- | --- |
| `SUPABASE_URL` | Variable | Project URL ของ Supabase |
| `SUPABASE_PUBLISHABLE_KEY` | Variable | publishable key ของ Supabase |
| `SUPABASE_SECRET_KEY` | Secret | secret key ของ Supabase |
| `LINE_CHANNEL_ACCESS_TOKEN` | Secret | LINE channel access token |
| `LINE_CHANNEL_SECRET` | Secret | LINE channel secret |
| `LINE_GROUP_ID` | Secret | Group ID จาก LINE webhook |
| `CRON_SECRET` | Secret | ข้อความสุ่มยาว ๆ ที่ใช้ร่วมกับ Worker |

5. กด `Save and Deploy` Cloudflare จะตรวจพบโฟลเดอร์ `functions/` และ publish API routes ให้โดยอัตโนมัติ
6. เติม Supabase URL/publishable key ใน `assets/js/config.js` แล้ว commit/push อีกครั้งหากยังไม่ได้ใส่ก่อน deploy

Cloudflare Pages Functions ใช้ `context.env` เพื่ออ่านตัวแปร และ secret ที่ตั้งเป็น encrypted secret จะไม่แสดงค่าใน dashboard หลังบันทึก

## Deploy ระบบแจ้งเตือนตามเวลา

Cloudflare Pages ไม่มี cron trigger สำหรับ Pages Function โดยตรง จึงใช้ Cloudflare Worker แยกต่างหากเรียก `/api/reminders` ตามเวลา

1. แก้ `worker/wrangler.jsonc` หากต้องการเปลี่ยนเวลาเตือน ค่าเริ่มต้น `0 10 * * *` คือ 17:00 น. เวลาไทย (UTC+7)
2. ตั้งค่า Worker secrets:

```powershell
npx wrangler secret put REMINDER_ENDPOINT --config worker/wrangler.jsonc
npx wrangler secret put CRON_SECRET --config worker/wrangler.jsonc
```

ตั้ง `REMINDER_ENDPOINT` เป็น `https://YOUR_PAGES_DOMAIN/api/reminders` และใช้ค่า `CRON_SECRET` เดียวกับ Cloudflare Pages

3. Deploy Worker:

```powershell
npx wrangler deploy --config worker/wrangler.jsonc
```

ระบบจะไม่ส่งรายงานแทนเจ้าหน้าที่บัญชี แต่จะส่งข้อความเตือนไปยังกลุ่ม LINE เมื่อถึงเวลาที่กำหนดและรายงานยังไม่อยู่ในสถานะ `ส่งแล้ว`

## รายการทดสอบก่อนใช้งานจริง

- ต้อนรับบันทึกรายการ `ลูกค้าเข้าพัก` ได้เพียงรายการเดียว
- บัญชีบันทึกรายการฟาร์มและเปลี่ยนสถานะเป็น `รอส่ง` ได้
- บัญชีส่ง LINE ได้ แต่ต้อนรับส่งไม่ได้
- การแก้ไขรายงานที่ส่งแล้วทำให้สถานะเป็น `แก้ไขแล้ว รอส่งซ้ำ`
- LINE กลุ่มได้รับ Flex Message ที่มีทั้งยอดรายวันและยอดสะสม
- CSV/PDF แสดงวันที่เป็น พ.ศ. รูปแบบ `DD/MM/YYYY`
- Cron ส่งเฉพาะข้อความเตือน และไม่เปลี่ยนรายงานเป็น `ส่งแล้ว`

## เอกสารอ้างอิง

- [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Cloudflare Pages Functions](https://developers.cloudflare.com/pages/functions/)
- [Cloudflare Pages variables and secrets](https://developers.cloudflare.com/pages/functions/bindings/)
- [Cloudflare Pages Git integration](https://developers.cloudflare.com/pages/get-started/git-integration/)
- [LINE Messaging API push message](https://developers.line.biz/en/reference/messaging-api/nojs/#send-push-message)
