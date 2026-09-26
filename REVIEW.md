# PRODUCTIV Life OS — Panduan Penggunaan Lengkap (REVIEW)

> Executive Terminal untuk eksekusi harian: task, fokus, rutinitas, kalender, keuangan, proyek, refleksi, dan mirror diri — semua offline-first berbasis JSON.

---

## 1. Filosofi & Cara Kerja Aplikasi

- **Zero Friction**: semua aksi penting ≤ 2 klik. Navigasi utama lewat sidebar kiri (desktop: hover tepi kiri atau tombol `>`, mobile: tombol burger `☰` di header).
- **Offline-First JSON**: seluruh data tersimpan di `src/data/*.json` sebagai seed dan otomatis tersinkron ke **LocalStorage** browser setiap ada perubahan. Tanpa internet pun aplikasi jalan penuh. Browser diminta `navigator.storage.persist()` agar data tidak terhapus otomatis.
- **Reaktif (Zustand)**: tiap centang, tambah, hapus, atau timer tick langsung me-render ulang bagian yang berubah — grafik, badge, dan ring ikut bergerak real-time.
- **Tema**: Obsidian Slate dark (`#131315`), aksen hijau `#6ffbbe`, font Geist + JetBrains Mono.

---

## 2. Daily Operating Cadence (Workflow Harian yang Disarankan)

| Waktu | Halaman | Aksi |
|---|---|---|
| Pagi (05:30–09:00) | **Today** + **Routines** | Cek terminal, centang Morning Block (bangun, prayers, Qur'an) |
| Pagi–Siang | **Tasks** (Kanban) + **Focus** | Drag task ke kolom Doing, nyalakan Timer 25/50m atau Stopwatch |
| Siang | **Calendar** | Cek agenda Day view, timebox task backlog ke jam kosong |
| Sore | **Routines** + **Today** | Workout & English practice, cek throughput harian |
| Malam | **Finance** | Catat pengeluaran via `+ Add Transaction` |
| Malam | **Review** | Klik **Autofill**, baca, sesuaikan, Save |
| Malam | **Mirror** | Baca cognitive load & outlier, reschedule bila perlu |
| Mingguan | **Settings** | Export JSON backup |

---

## 3. Panduan Fitur A–Z & Cara Mengisi Tiap Bagian

### ☀️ 3.1 Today Dashboard (`#today`)
Cockpit 3 kolom untuk hari yang sedang dilihat.
- **Day switcher** (`‹ Today ›`): geser hari (Yesterday / Today / Tomorrow / ±Nd). **Semua** isi halaman ikut tanggal aktif: task list, timeline agenda, finance snapshot, throughput, sparkline.
- **Daily Throughput**: `% selesai = completed ÷ total task tanggal aktif`.
- **Today's Tasks**: daftar task tanggal aktif. Quick input + `Enter` menambah task ke tanggal aktif. Klik baris = buka Task Inspector; klik kotak = toggle selesai (otomatis isi `completedAt`).
- **Weekly Pace sparkline**: grafik 7 hari **real** — jumlah task selesai per hari dari JSON + delta `%` vs 7 hari sebelumnya. Tooltip menampilkan angka per hari.
- **Focus widget**: Start/Pause + preset cycle (25→50→15). Di mode stopwatch tampil badge `SW`.
- **Timeline**: agenda kalender tanggal aktif (klik = toggle selesai).
- **Routines**: centang langsung (ikut tanggal aktif).
- **Finance snapshot**: spend tanggal aktif vs daily target, liquid balance, tombol `+ Add`.
- **Mirror System Note**: rekomendasi pertama dari Mirror AI.

### 📋 3.2 Tasks & Inspector (`#tasks`)
- **View List / Kanban**: List = grup Today + Upcoming; Kanban = 3 kolom (To Do / Doing / Done).
- **Drag & Drop Kanban**: seret kartu antar kolom (desktop). Status + completed tersimpan otomatis. Di HP pakai dropdown **Board Status** di Task Inspector.
- **Filter tab**: All / Today / Upcoming / Overdue / Done — berlaku di List DAN Kanban.
- **Search** (`/`): cocokkan judul + project + tags.
- **Dropdown Project** (otomatis terisi dari data) dan **Priority** + tombol **Reset ✕**.
- **Task Inspector Drawer** (klik baris/kartu): ubah judul, Board Status, Priority, Due Date (`Today`, `Tomorrow`, atau teks), Estimate, notes; Subtask tambah/centang/hapus; tombol hapus pakai konfirmasi 2 langkah (Yes/No); **Initiate Focus Session** = set target + pindah ke Focus + start timer.

### 📅 3.3 Calendar & Schedule (`#calendar`)
- **Navigasi minggu** (`‹ September 2026 ›` + `TODAY`): geser dan reset minggu.
- **View Day**: strip 7 tanggal + agenda list hari terpilih (Mark done + Edit).
- **View Week**: grid waktu 08:00–20:00 di desktop (kartu diposisikan dari jam real, garis "now" di hari ini); di HP otomatis jadi agenda list per hari (anti-tumpuk).
- **View Month**: grid kalender + dot event per tanggal; klik tanggal loncat ke Day view.
- **New Event** (modal): isi Title*, Date, Category, Start/End, Location → tersimpan ke `calendar.json`.
- **My Events (JSON)**: daftar semua event + toggle + edit + hapus (konfirmasi modal).
- **Backlog Queue**: task belum selesai — klik untuk buka inspector.

### 🚀 3.4 Projects Hub (`#projects`)
- **Navigator kiri**: daftar Active + Archived, klik untuk ganti detail kanan.
- **Detail kanan**: breadcrumb, status, hero, 4 metrik (Progress, Milestones, Time, Deadline), tombol hapus (konfirmasi modal).
- **Milestones**: klik untuk toggle — progress % dihitung otomatis.
- **Project Notes**: textarea + **Save Notes** (indikator "Tersimpan ✓").
- **Gallery**: **Add Image** → gambar **dikompres otomatis ke JPEG ≤ 89KB di browser** (Canvas, tanpa upload ke mana pun) → thumbnail + ukuran KB → klik untuk preview fullscreen → hapus per gambar.
- **Linked Tasks**: semua task dengan nama project sama — centang langsung / klik buka inspector.
- **New** (modal): Name*, Tagline, Category, Description.

### ⏱️ 3.5 Focus Workspace (`#focus`)
- **Mode Timer / Stopwatch**: Timer = countdown preset (25/5, 50/10, 15m Sprint). Stopwatch = count-up bebas, save kapan saja (min. 1 detik tercatat).
- **Zen Ring**: lingkaran progress animasi 1 detik/tick + glow; label FLOW INTERVAL / STOPWATCH; status LIVE/PAUSED/READY.
- **Kontrol**: Start/Pause, +5 Min, Skip (= finish & catat sesi), Reset.
- **Binaural Alpha Waves (10Hz)**: 210Hz kiri + 220Hz kanan via Web Audio. **Global & persisten** — tetap bunyi pindah page/tab, status tersimpan di JSON. Kontrol ada di Focus, **popup timer**, dan **jendela PiP**.
- **Target Task**: dropdown task aktif → dipakai timer, popup, PiP, dan judul tab.
- **History**: tiap sesi tercatat (task, durasi, jam, tanggal) → dipakai Review & Mirror.
- **FloatingTimer popup**: muncul otomatis saat timer jalan di SEMUA halaman — drag, minimize, pause/resume, reset, buka Focus, kontrol audio.
- **Pop-out PiP**: jendela OS always-on-top (ring + kontrol + audio), auto-buka saat start. Butuh Chrome/Edge 116+; Firefox/Safari fallback ke popup dalam-app.
- **Judul tab browser** ikut menampilkan `⏱ MM:SS • task`.

### 🔄 3.6 Routines & Habits (`#routines`)
- **3 blok waktu**: Morning / Afternoon / Evening + counter DONE per blok.
- **Kartu routine**: klik = toggle (streak +1/-1 otomatis + bunyi). Ada tombol **edit** (judul, blok, jam, tag, note) dan **hapus** (konfirmasi modal). Tombol aksi selalu terlihat di HP.
- **7-Day Consistency Matrix**: grid routine × 7 hari terakhir. **Klik dot untuk tandai hari lalu** — berguna mengisi yang kelupaan.
- **New Routine** (modal): Name*, Block, Time, Note.

### 💳 3.7 Finance & Ledger (`#finance`) — 5 tab
- **Overview**: Total Net Worth, **30-Day Velocity Arc REAL** (kurva halus dari saldo kumulatif harian transaksi September + tooltip min/max), kartu Income/Expense/Savings dihitung dari JSON, preview Budget + Accounts, 5 transaksi terakhir.
- **Transactions**: search (judul/kategori/catatan), filter All/Expense/Income, filter kategori dinamis, sort Newest/Oldest/Highest/Lowest, total in/out, **edit** + hapus (saldo otomatis dikembalikan), export `finance.json`.
- **Budget**: edit Monthly Cap, CRUD budget kategori (nama, kategori, cap). Spent dihitung otomatis dari transaksi bulan berjalan + bar OVER bila jebol.
- **Accounts**: CRUD account (nama, detail, saldo, ikon), total agregat, **transfer antar account** (validasi saldo).
- **Targets (Target Pembelian)**: CRUD target (nama*, harga*, terkumpul awal, prioritas, catatan), progress bar + status FUNDED, **Alokasi** (potong liquidBalance, capped otomatis), **Bought ✓** / batalkan.
- **Add Transaction** (modal, shortcut `Alt+E`): Expense/Income, nominal*, deskripsi*, kategori, tanggal. Saldo ter-update instan.

### 📊 3.8 Review & Reflection (`#review`)
- **Periode Daily/Weekly/Monthly**: seluruh telemetri (task, fokus, routine, skor) dihitung ulang sesuai scope.
- **Throughput Delta strip**: velocity, deep work (jam + sesi), routine adherence, energy — semua dari JSON + System Integrity gabungan.
- **Trend 7 hari**: bar chart task selesai per hari (hover = angka).
- **Form retrospektif**: Key Win, Friction, Decision + rating 1–10 + energy. Tombol **Autofill** membuat draft dari data real (tinggal sesuaikan) → Save → masuk audit log.
- **Audit log**: filter ikut periode, hapus per entri, export `review.json`.

### 🤖 3.9 Mirror (`#mirror`) — kaca kemampuan, AI penuh menyusul
- **Cognitive Load /100 + Friction Index**: dihitung live (pending ×6, overdue ×12, jam fokus, adherence routine).
- **Velocity bar**: segmen Shipped / Overdue / Pending real + ringkasan fokus–routine–spend hari ini.
- **Anomalous Resistance**: outlier REAL (overdue dulu, lalu prioritas tertinggi) + diagnosis + tombol **Reschedule ke Today** + Open. Kosong = status "Zero resistance".
- **Circadian Heatmap 24 jam**: intensitas dari jam sesi fokus + event kalender (bukan statis).
- **Directives**: rekomendasi dari JSON.
- **Chat terminal**: rule-based kontekstual (task/keuangan/routine/fokus) + autoscroll + bunyi kirim. *AI generatif (LLM) belum disambung — by design tahap akhir.*

### ⚙️ 3.10 Settings (`#settings`)
- **Profile**: Display Name + Role/Title (tersimpan, tampil di header & greeting).
- **Preferences**: Pomodoro default, Daily Spending Cap, toggle Sound FX / Telemetry / Notifications (switch aksesibel).
- **Backup**: **Export All JSON**, export per-file (10 tombol `*.json`), **Import JSON** (validasi ekstensi `.json`, maks 5MB, validasi struktur), **Reset** ke seed (konfirmasi modal).
- **Telemetry panel**: info framework/state/sidebar + status.

---

## 4. Navigasi & Shortcut Keyboard

| Shortcut | Fungsi |
|---|---|
| `⌘K` / `Ctrl+K` atau `/` | Command palette (navigasi, cari task, aksi cepat; panah ↑↓ + Enter) |
| `N` | New Task |
| `Alt+E` | Log expense |
| `Esc` | Tutup modal/drawer/palette/sidebar/notif |
| `Alt+1..0` | Loncat ke 10 halaman |
| Klik avatar / logo | Settings / Today |

Sidebar: desktop = hover tepi kiri atau tombol `>` (disembunyikan di HP); HP = tombol burger `☰` di header.

---

## 5. Data, Storage & Backup

- Seed: `src/data/*.json` — `user, tasks, projects, calendar, focus, routines, finance, review, mirrorAi, settings`.
- Runtime: seluruh perubahan auto-save ke **LocalStorage** (`PRODUCTIV_LIFE_OS_V2_DATA`) + `navigator.storage.persist()` agar tidak terhapus otomatis.
- Field tanggal memakai ISO `YYYY-MM-DD`; basis "hari ini" = `2026-09-26` (`BASE_TODAY_ISO` di `src/utils/date.ts`).
- Backup rutin via **Settings → Export All JSON**. Untuk pindah perangkat: export di A → import di B.

## 6. Batasan yang Diketahui

- PiP always-on-top butuh Chrome/Edge 116+ (Firefox/Safari: popup dalam-app + judul tab sebagai fallback).
- Audio browser butuh satu klik user pertama (kebijakan autoplay) — setelah itu persisten.
- Gambar proyek disimpan sebagai dataURL di JSON — cocok untuk dokumentasi ringan; untuk ratusan foto disarankan pindah ke IndexedDB di iterasi berikut.
