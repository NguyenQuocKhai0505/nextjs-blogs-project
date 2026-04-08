/**
 * FILE: src/lib/db/index.ts
 * MỤC ĐÍCH: File này là điểm trung tâm để kết nối và quản lý database
 * - Tạo connection pool để kết nối PostgreSQL
 * - Khởi tạo Drizzle ORM instance với schema
 * - Export các function để sử dụng trong toàn bộ ứng dụng
 */

// Import Drizzle ORM cho PostgreSQL
import {drizzle} from "drizzle-orm/node-postgres"

// Import Pool từ thư viện pg (PostgreSQL client) để quản lý connection pool
import {Pool} from "pg"

// Import toàn bộ schema (tables: users, posts, accounts, sessions + relations)
// Schema này được dùng để Drizzle biết cấu trúc database và các quan hệ giữa bảng
import * as schema from "./schema"

/**
 * TẠO CONNECTION POOL
 * Pool quản lý nhiều kết nối database, tái sử dụng thay vì tạo mới mỗi lần
 * 
 * Lợi ích:
 * - Hiệu suất cao: Tái sử dụng kết nối có sẵn
 * - Quản lý tự động: Tự động tạo/đóng kết nối khi cần
 * - Giới hạn số kết nối: Tránh quá tải database
 */
const pool = new Pool({
    // Connection string từ biến môi trường
    // Format: postgresql://username:password@host:port/database
    // Ví dụ: postgresql://user:pass@localhost:5432/myapp
    connectionString: process.env.DATABASE_URL,
    
    // Cấu hình SSL (Secure Socket Layer) cho kết nối bảo mật
    // - Production: Bật SSL với rejectUnauthorized: false (cho phép self-signed certificates)
    // - Development: Tắt SSL (false) vì thường chạy local không cần SSL
    ssl: process.env.NODE_ENV === "production" ?
    {
        rejectUnauthorized: false  // Cho phép certificate không được CA chứng nhận
    }:false,
    
    // Số lượng kết nối tối đa trong pool (default: 10)
    // Khi có > 10 requests đồng thời, các request phải đợi đến khi có kết nối trống
    max: 10,
    
    // Tối ưu cho production - giảm thời gian chờ kết nối
    connectionTimeoutMillis: 10000, // Tăng lên 10 giây timeout
    idleTimeoutMillis: 30000, // Đóng kết nối idle sau 30s
    keepAlive: true,
    keepAliveInitialDelayMillis: 10000,
})

// Log database connection errors
pool.on('error', (err) => {
    console.error('[DB] Unexpected error on idle client:', err)
})

pool.on('connect', () => {
    console.log('[DB] New client connected to database')
})

/**
 * EXPORT DRIZZLE INSTANCE
 * 
 * Đây là object chính để query database trong toàn bộ ứng dụng
 * 
 * Cách sử dụng:
 * - db.query: Dùng với relations (tự động JOIN)
 * - db.select, db.insert, db.update, db.delete: Query thủ công
 * 
 * Ví dụ:
 * ```typescript
 * import { db } from "@/lib/db"
 * 
 * // Query với relations
 * const posts = await db.query.posts.findMany({
 *   with: { author: true }
 * })
 * 
 * // Query thủ công
 * const users = await db.select().from(users)
 * ```
 */
export const db = drizzle(pool, {schema})

/**
 * HÀM LẤY CLIENT TRỰC TIẾP TỪ POOL
 * 
 * Mục đích: Lấy một client từ pool để thực hiện các thao tác đặc biệt
 * 
 * Khi nào dùng:
 * - Cần transaction (BEGIN, COMMIT, ROLLBACK)
 * - Cần thực hiện raw SQL queries phức tạp
 * - Cần giữ kết nối trong thời gian dài cho nhiều operations
 * 
 * ⚠️ QUAN TRỌNG: Phải release client sau khi dùng xong!
 * 
 * Ví dụ sử dụng:
 * ```typescript
 * const client = await getClient()
 * try {
 *   await client.query('BEGIN')
 *   // ... các operations
 *   await client.query('COMMIT')
 * } catch (error) {
 *   await client.query('ROLLBACK')
 * } finally {
 *   client.release() // ← BẮT BUỘC phải release!
 * }
 * ```
 */
export async function getClient(){
    // Lấy một client từ pool (nếu pool đầy sẽ đợi đến khi có chỗ trống)
    const client = await pool.connect()
    return client
}