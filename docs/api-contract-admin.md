# Familia Admin API — Contract Integrasi FE

Ringkasan kontrak endpoint **Admin Panel**. Ditandai **[NEW]** untuk endpoint baru dan **[CHG]** untuk endpoint lama yang perilakunya berubah.

## Konvensi umum

- **Base URL:** `http://<host>:3001` (tanpa prefix `/api/v1`). Dokumentasi Swagger: `/api`.
- **Auth:** semua endpoint `/admin/*` butuh header `Authorization: Bearer <access_token>` dan user ber-role `ADMIN`. Token tidak valid → `401`, role bukan ADMIN → `403`.
- **Format response sukses:**

```json
{ "status": true, "message": "Success ...", "data": {}, "pagination": { } }
```

`pagination` hanya ada pada endpoint list.

- **Pagination** (query): `page` (default 1), `limit` (1–100, default 10). Response:

```json
{ "current_page": 1, "total_page": 5, "total_data": 42, "next": "?page=2&limit=10", "prev": null }
```

- **Sort:** `sort_by` dan `sort_order` (`asc`|`desc`). Nilai valid dan defaultnya ada di tiap endpoint.
- **Search:** `search_by` + `search` (keduanya harus diisi agar berlaku).
- **Format tanggal:**
  - Response: string ISO 8601.
  - Request body (`z.iso.datetime`): ISO datetime berakhiran `Z`, contoh `2026-03-01T09:00:00Z`.
  - Query `startDate`/`endDate`: ISO datetime atau `YYYY-MM-DD`. Jika `endDate` hanya tanggal, seluruh hari itu ikut tercakup.
- **Error:**

| Status | Arti | Bentuk |
|---|---|---|
| 400 | Validasi gagal / aturan bisnis | `{ "statusCode": 400, "message": "...", ... }` (validasi zod memuat detail per field) |
| 401 / 403 | Belum login / bukan ADMIN | `{ "statusCode", "message" }` |
| 404 | Data tidak ditemukan | `{ "statusCode": 404, "message": "..." }` |
| 409 | Duplikat (`name`/`level` tier) atau data masih direferensi | `{ "statusCode": 409, "message": "..." }` |

- **PATCH** bersifat partial: kirim hanya field yang diubah. Field tidak bisa di-set `null` lewat PATCH.
- **Search tanpa `search_by`:** di semua list, `search` saja (tanpa `search_by`) mencari ke beberapa kolom default modul tersebut. Dengan `search_by`, pencarian dibatasi ke satu kolom.
- **Rentang (`min*`/`max*`, `startDate`/`endDate`):** salah satu batas boleh dikosongkan. Nilai bukan angka → `400`.
- **Export `.xlsx`:** setiap modul punya `GET .../export` yang menerima query filter **yang sama** dengan list (kecuali `page` dan `limit`; `sort_by`/`sort_order` tetap berlaku) dan mengembalikan file biner, bukan envelope JSON:
  - `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
  - `Content-Disposition: attachment; filename="vet-clinic-{modul}-{YYYY-MM-DD}.xlsx"` (tanggal WIB)
  - Baris pertama berisi header (tebal, berlatar abu), lebar kolom otomatis, tanggal ditulis `YYYY-MM-DD HH:mm` (WIB).
  - Maksimal 50.000 baris per file.
  - Di FE (axios) pakai `responseType: "blob"`; error tetap berupa JSON (`400`/`401`/`403`).

## Auth

| Method | Path | Body | Response |
|---|---|---|---|
| POST | `/auth/login` | `{ username, password }` (email atau no. HP) | envelope, `data: { access_token, refresh_token }` |
| POST | `/auth/refresh-token` | `{ refresh_token }` | **tanpa envelope**: `{ access_token, refresh_token }` |
| POST | `/auth/register-admin` **[CHG]** | Butuh `Authorization: Bearer` milik **ADMIN** (`401`/`403` jika tidak). Body: `email`, `password`, `phone`, `first_name`, `last_name`. Response tidak lagi memuat `password`/`hashed_refresh_token`. Admin pertama dibuat lewat `npm run seed` | user (tanpa field kredensial) |
| POST | `/auth/change-password` **[CHG]** | Mengganti password sekaligus mencabut refresh token (login ulang di perangkat lain) | message |

Rate limit: default 120 request/menit per IP untuk semua endpoint; `/auth/login`, `/auth/register-*` 5/menit, `/auth/refresh-token` 10/menit (`429` jika terlewati). Swagger `/api` tidak tersedia saat `NODE_ENV=production`.

---

## Tiers — `/admin/tiers`

| Method | Path | |
|---|---|---|
| GET | `/list` **[CHG]** | Query: `page, limit, sort_by` (`created_at\|name\|level\|required_points`, default `level`), `sort_order` (default `asc`), `search_by` (`name\|description`), `search`. Item: tier + `_count: { memberships }` |
| GET | `/export` **[NEW]** | Export `.xlsx` (`vet-clinic-tiers-*.xlsx`). Query: `sort_by`, `sort_order`, `search_by`, `search`. Kolom: Name, Description, Level, Required Points, Members, Created At |
| GET | `/detail/:id` **[NEW]** | Tier + `memberships: [{ id, points, seasonal_points, users: { id, email, phone, first_name, last_name } }]` |
| POST | `/create` | Body: `name`, `description?`, `level` (int ≥ 0, unik), `required_points` (int ≥ 0, default 0). `409` jika `name`/`level` duplikat |
| PATCH | `/update/:id` **[CHG]** | Body: `name?, description?, level?, required_points?, resync_members?` (bool, default `false`). Jika `resync_members: true` dan `level`/`required_points` ikut diubah, response memuat `resync: { evaluated, changed }`. Evaluasi ulang hanya **menaikkan** tier |
| DELETE | `/delete/:id` **[NEW]** | `data`: tier + `affected_members` + `warning` (null jika tidak ada member). `message` berisi warning bila ada member terdampak (member jadi tanpa tier) |

## Memberships — `/admin/membership`

Bentuk item membership: `{ id, points, seasonal_points, last_season_reset, created_at, updated_at, userId, tierId }`.

| Method | Path | |
|---|---|---|
| GET | `/list` **[CHG]** | Query: `page, limit, name, email, phone, tier_id` (uuid), `minPoints`, `maxPoints` (rentang saldo `points`), `startDate`, `endDate` (rentang tanggal bergabung, `created_at`; **filter baru**), `sort_by` (`created_at\|points\|seasonal_points\|first_name\|email`, default `created_at`), `sort_order` (default `desc`), `search_by` (`name\|email\|phone`), `search`. Item: membership + `users: { id, email, phone, first_name, last_name, role }` + `tiers: { id, name, required_points }` |
| GET | `/detail/:id` **[NEW]** | Membership + `users` (+ `avatar`, `pets[]` aktif) + `tiers` + `points_history` (10 terbaru) + `tier_history: [{ id, created_at, old_tier, new_tier }]` (`old_tier`/`new_tier`: `{ id, name, level }` atau `null`) |
| POST | `/create` | Daftarkan **customer baru** + membership. Body: `email`, `phone` (min 8), `first_name`, `last_name?`, `password` **[CHG: wajib]** (min 8, huruf besar, huruf kecil, angka; tidak ada password default lagi) |
| POST | `/init` **[NEW]** | Buat membership untuk **customer yang sudah ada**. Body: `{ userId }`. Otomatis masuk tier level terendah. `404` user tidak ada, `400` bukan customer, `409` sudah punya membership |
| GET | `/export` **[NEW]** | Export `.xlsx` (`vet-clinic-memberships-*.xlsx`). Query: sama dengan `/list` tanpa `page`/`limit`. Kolom: Name, Email, Phone, Tier, Points, Seasonal Points, Joined At |
| PATCH | `/update/:id` **[NEW]** | Edit profil member (`:id` = id **membership**). Body partial: `first_name`, `last_name`, `email`, `phone` (min 8); minimal satu field, body kosong → `400`. `409` jika email/no. HP sudah dipakai akun lain, `404` jika member tidak ada/sudah dihapus. Response: item membership seperti `/list` |
| DELETE | `/delete/:id` **[NEW]** | **Soft delete** user (`users.deleted_at` diisi, refresh token dicabut). Member hilang dari list/detail membership dan list pet, dan tidak bisa login lagi. Poin, redemption dan rekam medis tetap tersimpan. `data: { id, userId, deleted_at }`. `404` jika sudah dihapus |
| PATCH | `/tier/:id` **[NEW]** | Override tier manual. Body: `{ tierId }`. Tercatat di `tier_history`. `400` bila tier sama, `404` bila membership/tier tidak ada. Response: membership + `tiers` |

## Points — `/admin/points`

| Method | Path | |
|---|---|---|
| GET | `/history` **[CHG]** | Query: `page, limit, sort_by` (`created_at\|amount\|type`, default `created_at`), `sort_order` (default `desc`), `search_by` (`description\|type\|customer\|reference_id`), `search` (tanpa `search_by`: nama/HP customer, `reference_id`, deskripsi), `type` (`EARNED\|REDEEMED\|ADJUSTMENT`), `membershipId` (uuid), `minAmount`, `maxAmount` (rentang `amount`, boleh negatif), `startDate`, `endDate`. Item: `{ id, membershipId, amount, type, description, reference_id, created_at, membership: { id, userId, users: { id, email, phone, first_name, last_name } } }` |
| GET | `/history/export` **[NEW]** | Export `.xlsx` (`vet-clinic-points-history-*.xlsx`). Query: sama dengan `/history` tanpa `page`/`limit`. Kolom: Date, Customer, Phone, Type, Amount, Description, Reference ID |
| POST | `/adjust` **[NEW]** | Body: `membershipId` (uuid), `amount` (int ≠ 0; positif menambah, negatif mengurangi), `type` (`ADJUSTMENT` default \| `EARNED`; `EARNED` wajib `amount > 0`), `description?`. `400` jika saldo jadi negatif |

Response `/adjust`:

```json
{ "history": { }, "points": 120, "seasonal_points": 110, "tier": { "changed": true, "oldTierId": "...", "newTierId": "..." } }
```

## Coupons — `/admin/reward`

| Method | Path | |
|---|---|---|
| GET | `/list` **[CHG]** | Query: `page, limit, sort_by` (`created_at\|title\|points_cost`), `sort_order`, `search_by` (`title\|description`), `search`, `minCost`, `maxCost` (rentang `points_cost`). Item: coupon + `_count: { redemptions }` |
| GET | `/export` **[NEW]** | Export `.xlsx` (`vet-clinic-coupons-*.xlsx`). Query: sama dengan `/list` tanpa `page`/`limit`. Kolom: Title, Description, Points Cost, Total Redemptions, Created At |
| GET | `/redemptions/export` **[NEW]** | Export `.xlsx` (`vet-clinic-redemptions-*.xlsx`). Query: sama dengan `/redemptions` tanpa `page`/`limit`. Kolom: Date, Customer, Phone, Coupon, Points Spent |
| GET | `/detail/:id` **[NEW]** | Coupon + `redemptions: [{ id, points_spent, created_at, userId, couponId, users: {...} }]` |
| GET | `/redemptions` **[NEW]** | Query: `page, limit, sort_by` (`created_at\|points_spent`, default `created_at`), `sort_order` (default `desc`), `userId`, `couponId`, `search` (nama/HP customer atau judul kupon), `startDate`, `endDate` (rentang tanggal redeem). Item: `{ id, points_spent, created_at, userId, couponId, users: { id, email, phone, first_name, last_name }, coupon: { id, title, points_cost } }` |
| POST | `/redeem/:id` **[NEW]** | Tukar kupon atas nama customer. Body: `{ userId }`. Response: `{ redemption, balance: { points, seasonal_points } }`. `404` kupon/membership tidak ada, `400` poin tidak cukup |
| POST | `/create` | Body: `title`, `description?`, `points_cost` (int ≥ 1) |
| PATCH | `/update/:id` | Body partial: `title, description, points_cost` (≥ 1) |
| DELETE | `/delete/:id` **[CHG]** | `409` jika kupon sudah pernah diredeem |

## Pets — `/admin/pet`

| Method | Path | |
|---|---|---|
| GET | `/list` **[CHG]** | Hanya pet aktif. Query: `page, limit, sort_by` (`created_at\|name\|species\|breed\|birth_date`), `sort_order`, `search_by` (`name\|species\|breed\|owner`; `owner` mencocokkan nama/no. HP pemilik), `search`, `userId`, `species`, `breed`, `is_neutered` (`true\|false`), `status` (`ACTIVE` default \| `ARCHIVED` \| `ALL`). `ACTIVE` = belum di-archive, `ARCHIVED` = soft-deleted saja. Pet milik member yang sudah dihapus tidak pernah ditampilkan. Item: pet (termasuk `deleted_at`) + `users: { id, first_name, last_name, phone }` + `_count: { medical_history }` |
| GET | `/export` **[NEW]** | Export `.xlsx` (`vet-clinic-pets-*.xlsx`). Query: sama dengan `/list` tanpa `page`/`limit`; `status` tanpa default, dan `includeDeleted=true` setara `status=ALL`. Kolom: Name, Species, Breed, Birth Date, Neutered, Owner, Owner Phone, Medical Records, Status (Active/Archived), Created At |
| PATCH | `/restore/:id` **[NEW]** | Pulihkan pet yang di-archive; tanpa body. `data`: pet dengan `deleted_at: null`. `404` pet tidak ada, `400` pet belum di-archive, `400` pemilik sudah dihapus |
| GET | `/detail/:id` **[CHG]** | Pet + `users` (+ `email`) + `medical_history[]` urut `administered_at` terbaru dulu |
| POST | `/create` | Body: `userId`, `name`, `species?`, `breed?`, `birth_date?` (ISO datetime), `is_neutered?`, `avatar?` (string URL). `404` jika owner tidak ada/sudah dihapus |
| PATCH | `/update/:id` | Body partial: `name, species, breed, birth_date, is_neutered, avatar` |
| DELETE | `/delete/:id` | Soft delete; pet hilang dari list dan detail |

## Medical Records — `/admin/medical-history`

Bentuk item: `{ id, petId, type, title, complaint, clinical_signs, diagnosis, weight, temperature, appetite, defecation, urination, vomiting, treatment, prescription, notes, vaccine_name, dose_number, administered_at, discharged_at, next_due_date, doctor_name, medical_staff_name, created_at, updated_at, pet: { id, name, species, users: { id, first_name, last_name, phone } } }`. `type`: `VACCINE | DEWORMING | GROOMING | RAWAT_INAP | RAWAT_JALAN`.

| Method | Path | |
|---|---|---|
| GET | `/export` **[NEW]** | Export `.xlsx` (`vet-clinic-medical-records-*.xlsx`). Query: sama dengan `/list` tanpa `page`/`limit`. Kolom: Administered At, Pet, Species, Owner, Owner Phone, Type, Title, Vaccine, Dose, Complaint, Clinical Signs, Diagnosis, Weight (kg), Temperature (°C), Appetite, Defecation, Urination, Vomiting, Treatment, Prescription, Notes, Doctor (DPJP), Medical Staff, Next Due, Discharged At |
| GET | `/vaccines` **[NEW]** | Master data vaksin per species, untuk dropdown. Query: `species` (teks bebas, mis. `Anjing`/`Kucing`) **atau** `petId` (salah satu wajib, `400` jika keduanya kosong). Response `data`: `[{ name, audience: "DOG"\|"CAT"\|"BOTH", description }]`. Rabies (`BOTH`) muncul untuk anjing dan kucing; spesies lain hanya mendapat Rabies |
| GET | `/list` **[CHG]** | Query: `page, limit, sort_by` (`created_at\|administered_at\|title\|type\|next_due_date`), `sort_order`, `search_by` (`title\|complaint\|diagnosis\|vaccine_name\|doctor_name\|medical_staff_name`; tanpa `search_by` mencari di semua kolom itu + nama pet), `search`, `petId`, `userId` (pemilik pet), `type`, `doctor_name`, `medical_staff_name`, `startDate`, `endDate` (rentang `administered_at`). Item: bentuk di atas |
| GET | `/upcoming-dues` **[NEW]** | Jadwal berikutnya. Query: `page, limit, days` (1–30, default 30), `type`. Urut `next_due_date` terdekat dulu |
| GET | `/detail/:id` **[CHG]** | Bentuk item di atas (sudah memuat pet dan pemilik) |
| POST | `/create` **[CHG]** | Body: `petId`, `type`, `title`, `administered_at`, lalu opsional: `complaint`, `clinical_signs`, `diagnosis`, `weight` (kg, > 0), `temperature` (°C, 20–50), `appetite`, `defecation`, `urination`, `vomiting`, `treatment`, `prescription`, `notes`, `doctor_name` (DPJP), `medical_staff_name` (petugas/paraf), `vaccine_name`, `dose_number` (int ≥ 1), `next_due_date` (diabaikan untuk `VACCINE`/`DEWORMING`), `discharged_at`, `award_points?` (int ≥ 1). Aturan di bawah |
| PATCH | `/update/:id` **[CHG]** | Body partial (field create tanpa `award_points`). Field klinis (`complaint` … `medical_staff_name`) boleh `null` untuk mengosongkan nilai. Field `description` lama sudah dihapus (diganti `complaint`/`clinical_signs`/`notes`). Aturan di bawah dievaluasi terhadap hasil akhir record. `next_due_date` dihitung ulang bila `type`, `administered_at`, `dose_number`, `vaccine_name` atau `petId` ikut diubah |
| DELETE | `/delete/:id` | Hard delete; `data` = record yang dihapus |

Aturan `type`:
- Rawat jalan vs rawat inap hanya beda di UI: satu tabel, satu record per kunjungan / per hari laporan rawat inap. "Hari ke-X" dihitung di client dari urutan `administered_at` record `RAWAT_INAP` per pet (sejak `discharged_at` terakhir); tidak ada kolom `day_number`.
- `VACCINE` → `vaccine_name` **wajib** dan harus ada di master data vaksin untuk species pet (`GET /vaccines`), jika tidak `400` dengan daftar yang diizinkan. Tipe lain → `vaccine_name` dan `dose_number` otomatis dikosongkan. Pada update, nama vaksin lama (di luar katalog) tidak ditolak selama vaksin/pet/tipe tidak diubah.
- **Dosis:** `dose_number` boleh dikirim; jika kosong otomatis = jumlah record vaksin yang sama untuk pet itu sebelumnya + 1.
- **`next_due_date` otomatis** (nilai kiriman dari client diabaikan):
  - `VACCINE` dosis 1–3 → `administered_at` + 1 bulan; dosis ≥ 4 → + 12 bulan.
  - `DEWORMING` → `administered_at` + 30 hari.
- `discharged_at` hanya boleh untuk `RAWAT_INAP` (boleh kosong saat pasien masih dirawat, diisi lewat PATCH saat pulang). `discharged_at` tidak boleh lebih awal dari `administered_at` (`400`; pada PATCH dicek terhadap record hasil akhir) dan boleh dikirim `null` untuk mengosongkan. Selain itu `400`.
- `award_points`: memberi poin `EARNED` ke owner pet dalam satu transaksi dengan pembuatan record. `400` jika owner belum punya membership.

## Notifications — pengingat otomatis

Pengingat dibuat oleh cron harian (08:00 WIB), disimpan di `notification_history`, dan dikirim **in-app** ke pemilik hewan. Item:
`{ id, petId, userId, category, target_due_date, title, message, is_read, read_at, created_at, pet: { id, name, species }, users: { id, first_name, last_name, phone } }`.

`category`:

| Kategori | Kapan dibuat |
|---|---|
| `PRE_VACCINE_DEWORMING` | H-14 sebelum `next_due_date` vaksin (obat cacing & kutu wajib diberikan paling lambat H-7). Tidak dibuat lagi mulai H-7, dan **tidak dibuat** jika pet sudah punya record `DEWORMING` yang diberikan 7–30 hari sebelum tanggal vaksin |
| `VACCINE_REMINDER` | H-7 sebelum `next_due_date` vaksin |
| `DEWORMING_ROUTINE` | 30 hari setelah record `DEWORMING` terakhir |

**Sekali kirim:** unik per `(petId, category, target_due_date)`. Notifikasi yang sama tidak muncul lagi selama jadwal tidak berubah; rekam medis baru yang menggeser jadwal memunculkan notifikasi baru. Vaksin yang jatuh tempo di hari yang sama untuk pet yang sama digabung menjadi satu notifikasi.

**Admin** — `/admin/notifications` (role `ADMIN`)

| Method | Path | |
|---|---|---|
| GET | `/list` **[NEW]** | Semua notifikasi terkirim. Query: `page, limit, sort_by` (`created_at\|target_due_date`, default `created_at`), `sort_order` (default `desc`), `category`, `is_read` (`true\|false`), `petId`, `userId`, `startDate`, `endDate` |

**Customer** — `/user/notifications` (role `CUSTOMER`, hanya milik sendiri)

| Method | Path | |
|---|---|---|
| GET | `/list` **[NEW]** | Query: `page, limit, category, is_read` (`true\|false`). Terbaru dulu |
| GET | `/unread-count` **[NEW]** | `data: { unread }` |
| PATCH | `/read/:id` **[NEW]** | Tandai satu notifikasi dibaca. `404` jika bukan milik user. `data: { id, is_read }` |
| PATCH | `/read-all` **[NEW]** | `data: { updated }` |

---

## Perilaku bisnis yang berdampak ke UI

- **Tier** ditentukan dari `seasonal_points`, bukan saldo `points`. Menukar kupon mengurangi `points`, tidak mengurangi `seasonal_points`, jadi tidak menurunkan tier.
- Tier hanya **naik** otomatis saat poin bertambah. Penurunan tier hanya terjadi lewat reset tahunan.
- **Reset tahunan otomatis** setiap 31 Desember 23:59:59 WIB: `seasonal_points` jadi 0 dan setiap member turun satu level tier (yang sudah di level terendah tetap). **Tidak ada endpoint untuk memicunya.**
- Override tier manual (`PATCH /tier/:id`) bisa tertimpa tier hasil promosi otomatis saat member berikutnya mendapat poin.
- Upload file belum ada: `avatar` berupa string URL.
