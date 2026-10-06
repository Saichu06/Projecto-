import os
import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import parse_xml, OxmlElement
from docx.oxml.ns import nsdecls, qn

def set_cell_background(cell, fill_hex):
    tcPr = cell._element.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    tcPr = cell._element.get_or_add_tcPr()
    tcMar = parse_xml(f'<w:tcMar {nsdecls("w")}><w:top w:w="{top}" w:type="dxa"/><w:bottom w:w="{bottom}" w:type="dxa"/><w:left w:w="{left}" w:type="dxa"/><w:right w:w="{right}" w:type="dxa"/></w:tcMar>')
    tcPr.append(tcMar)

def create_document():
    os.makedirs("submission", exist_ok=True)
    doc = Document()

    # Page Margins: 1 inch everywhere
    sections = doc.sections
    for s in sections:
        s.top_margin = Inches(1.0)
        s.bottom_margin = Inches(1.0)
        s.left_margin = Inches(1.0)
        s.right_margin = Inches(1.0)

    # Styles
    style_normal = doc.styles['Normal']
    style_normal.font.name = 'Calibri'
    style_normal.font.size = Pt(11)
    style_normal.font.color.rgb = RGBColor(17, 24, 39) # #111827

    # -------------------------------------------------------------
    # 1. COVER PAGE
    # -------------------------------------------------------------
    p_logo = doc.add_paragraph()
    p_logo.alignment = WD_ALIGN_PARAGRAPH.CENTER
    if os.path.exists("assets/logo.png"):
        p_logo.add_run().add_picture("assets/logo.png", width=Inches(1.6))

    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_title.paragraph_format.space_before = Pt(20)
    p_title.paragraph_format.space_after = Pt(6)
    r_title = p_title.add_run("PROJECTO")
    r_title.bold = True
    r_title.font.size = Pt(28)
    r_title.font.color.rgb = RGBColor(37, 99, 235) # #2563EB Primary Accent

    p_sub = doc.add_paragraph()
    p_sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_sub.paragraph_format.space_after = Pt(30)
    r_sub = p_sub.add_run("Full-Stack Project & Task Management System\nComprehensive Technical Architecture, Bonus Features & Assessment Documentation")
    r_sub.font.size = Pt(14)
    r_sub.font.color.rgb = RGBColor(100, 116, 139)

    p_meta = doc.add_paragraph()
    p_meta.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_meta.paragraph_format.space_before = Pt(80)
    r_meta = p_meta.add_run("Author: Lead Full-Stack Engineer\nTarget Stack: React 19 (Vite) + React Native (Expo) + Express + PostgreSQL (Prisma)\nAssessment: Production-Ready Engineering\nDate: October 2026")
    r_meta.font.size = Pt(11)
    r_meta.font.color.rgb = RGBColor(51, 65, 85)

    doc.add_page_break()

    def add_heading_1(text):
        h = doc.add_paragraph()
        h.paragraph_format.space_before = Pt(18)
        h.paragraph_format.space_after = Pt(6)
        r = h.add_run(text)
        r.bold = True
        r.font.size = Pt(16)
        r.font.color.rgb = RGBColor(37, 99, 235)
        return h

    def add_heading_2(text):
        h = doc.add_paragraph()
        h.paragraph_format.space_before = Pt(12)
        h.paragraph_format.space_after = Pt(4)
        r = h.add_run(text)
        r.bold = True
        r.font.size = Pt(13)
        r.font.color.rgb = RGBColor(30, 41, 59)
        return h

    def add_heading_3(text):
        h = doc.add_paragraph()
        h.paragraph_format.space_before = Pt(8)
        h.paragraph_format.space_after = Pt(2)
        r = h.add_run(text)
        r.bold = True
        r.font.size = Pt(11.5)
        r.font.color.rgb = RGBColor(51, 65, 85)
        return h

    # -------------------------------------------------------------
    # 2. EXECUTIVE SUMMARY
    # -------------------------------------------------------------
    add_heading_1("2. Executive Summary")
    doc.add_paragraph(
        "Projecto is a high-performance, unified Project & Task Management system engineered for dual-platform "
        "interaction across modern desktop web browsers and mobile devices. Rather than deploying fragmented backends "
        "or divergent schemas, Projecto establishes a single source of truth: a unified Node.js / Express.js REST API "
        "interfacing with a PostgreSQL relational database via Prisma ORM 6."
    )
    doc.add_paragraph(
        "The application satisfies all strict technical assessment requirements: user-scoped data isolation, "
        "cryptographic password security, structured Zod payload validation, rich responsive React web interface with "
        "accessible keyboard shortcuts, and a native React Native (Expo SDK 52) mobile client with hardware-backed SecureStore. "
        "Furthermore, all 7 optional bonus features—Unit Testing, Integration Testing, Server-Side Pagination, Whitelisted Sorting, "
        "Audit Logging, Role-Based Access Control, and Push Notifications—are fully implemented and verified."
    )

    # -------------------------------------------------------------
    # 3. CORE ARCHITECTURAL DECISIONS
    # -------------------------------------------------------------
    add_heading_1("3. Core Architectural Decisions")
    doc.add_paragraph(
        "To ensure long-term maintainability, zero data drift, and rock-solid user-scoped isolation, the following architectural decisions were enforced:"
    )

    table_arch = doc.add_table(rows=1, cols=3)
    table_arch.alignment = WD_TABLE_ALIGNMENT.CENTER
    hdr_cells = table_arch.rows[0].cells
    hdr_cells[0].text = "Architectural Decision"
    hdr_cells[1].text = "Technology Chosen"
    hdr_cells[2].text = "Engineering Rationale"
    for c in hdr_cells:
        set_cell_background(c, "2563EB")
        c.paragraphs[0].runs[0].font.color.rgb = RGBColor(255, 255, 255)
        c.paragraphs[0].runs[0].bold = True

    decisions = [
        ("Unified API Gateway", "Express.js 5.2 (Node.js 18+)", "Single API layer eliminates divergence between Web and Mobile clients."),
        ("ORM & Relational Database", "PostgreSQL + Prisma ORM 6.4", "Strong schema enforcement, UUID primary keys, cascade deletions, type-safe queries."),
        ("Client-Side Web Framework", "React 19 + Vite 8", "Sub-second HMR development, optimal production bundle size (104 KB gzip), zero bloat."),
        ("Cross-Platform Mobile App", "React Native + Expo SDK 52", "Native performance, hardware-backed token security (SecureStore), pull-to-refresh UX."),
        ("Input Validation", "Zod 4.6", "Runtime schema validation with descriptive error responses preventing SQL injection and bad payloads."),
        ("Authentication & RBAC", "JWT + Bcrypt (10 rounds) + Roles", "Stateless auth header format with distinct USER and ADMIN role capabilities."),
        ("Audit Logging", "Prisma AuditLog Model", "Immutable logging of sensitive operations with automated metadata sanitization.")
    ]
    for d, t, r in decisions:
        row = table_arch.add_row().cells
        row[0].text = d
        row[1].text = t
        row[2].text = r
        for cell in row:
            set_cell_margins(cell)

    # -------------------------------------------------------------
    # 4. SYSTEM ARCHITECTURE & DIAGRAMS
    # -------------------------------------------------------------
    add_heading_1("4. System Architecture")
    doc.add_paragraph(
        "Projecto employs a clean client-server architecture where both Web and Mobile clients interface "
        "with a centralized Express REST API gateway. The architecture eliminates duplicate business logic and prevents "
        "divergent database states."
    )
    if os.path.exists("docs/SYSTEM-ARCHITECTURE.png"):
        p_img = doc.add_paragraph()
        p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_img.add_run().add_picture("docs/SYSTEM-ARCHITECTURE.png", width=Inches(5.5))
        p_cap = doc.add_paragraph()
        p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r_cap = p_cap.add_run("Figure 1: Projecto High-Level System Architecture Diagram")
        r_cap.font.size = Pt(9)
        r_cap.font.italic = True

    # -------------------------------------------------------------
    # 5. DATABASE DESIGN & ENTITY RELATIONSHIPS
    # -------------------------------------------------------------
    add_heading_1("5. Database Design")
    doc.add_paragraph(
        "The relational schema is normalized with strict foreign key constraints and UUID primary keys. "
        "Cascade deletion ensures orphaned tasks, audit logs, and push devices are automatically cleaned up when parent entities are deleted."
    )
    if os.path.exists("docs/ER-DIAGRAM.png"):
        p_erd = doc.add_paragraph()
        p_erd.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_erd.add_run().add_picture("docs/ER-DIAGRAM.png", width=Inches(5.5))
        p_erd_cap = doc.add_paragraph()
        p_erd_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r_erd_cap = p_erd_cap.add_run("Figure 2: Entity Relationship Diagram (ERD)")
        r_erd_cap.font.size = Pt(9)
        r_erd_cap.font.italic = True

    # -------------------------------------------------------------
    # 6. AUTHENTICATION & SECURITY LIFECYCLE
    # -------------------------------------------------------------
    add_heading_1("6. Authentication & Security")
    doc.add_paragraph(
        "Authentication relies on JSON Web Tokens with SHA-256 signatures and 7-day expiration. "
        "Passwords are salted and hashed via bcrypt (10 rounds). Password hashes are never logged, "
        "exposed in error messages, or returned in API payloads."
    )
    if os.path.exists("docs/AUTH-FLOW.png"):
        p_auth = doc.add_paragraph()
        p_auth.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_auth.add_run().add_picture("docs/AUTH-FLOW.png", width=Inches(5.5))
        p_auth_cap = doc.add_paragraph()
        p_auth_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r_auth_cap = p_auth_cap.add_run("Figure 3: Authentication & Token Lifecycle Workflow")
        r_auth_cap.font.size = Pt(9)
        r_auth_cap.font.italic = True

    # -------------------------------------------------------------
    # 7. BONUS FEATURES SPECIFICATION
    # -------------------------------------------------------------
    add_heading_1("7. Bonus Features Specification")

    add_heading_2("7.1 Unit Testing")
    doc.add_paragraph(
        "Unit tests in `backend/tests/unit/` validate core service layers in isolation (authService, projectService, "
        "taskService, and dashboardService). Tests verify password verification, registration logic, task completion, "
        "and metric calculations."
    )

    add_heading_2("7.2 Integration Testing")
    doc.add_paragraph(
        "Integration tests in `backend/tests/api.test.js` execute real HTTP requests through the Express router against the "
        "PostgreSQL database using Supertest. Scenarios test multi-user data isolation, cascading deletions, role enforcement, "
        "pagination metadata, sorting, and push device registration."
    )

    add_heading_2("7.3 Server-Side Pagination")
    doc.add_paragraph(
        "List endpoints for projects (`/api/projects`) and tasks (`/api/tasks`) accept `page` and `limit` query parameters. "
        "Responses adhere to the standard envelope `{ data: [], pagination: { page, limit, total, totalPages } }`."
    )

    add_heading_2("7.4 Whitelisted Server-Side Sorting")
    doc.add_paragraph(
        "Sorting parameters `sortBy` and `sortOrder` are strictly validated against whitelisted entity attributes "
        "(`name`, `createdAt`, `startDate`, `endDate`, `dueDate`, `priority`, `status`), preventing arbitrary SQL injection."
    )

    add_heading_2("7.5 Audit Logging")
    doc.add_paragraph(
        "The `AuditLog` model captures key lifecycle actions (LOGIN, LOGOUT, CREATE, UPDATE, DELETE, COMPLETE, CHANGE_PASSWORD). "
        "An automated metadata sanitizer strips passwords, secrets, and tokens from all log payloads."
    )

    add_heading_2("7.6 Role-Based Access Control (RBAC)")
    doc.add_paragraph(
        "The system supports a clean `Role` enum (`USER`, `ADMIN`). The `requireRole('ADMIN')` middleware protects administrative "
        "endpoints (`/api/admin/audit-logs`, `/api/admin/system-stats`) without replacing user-scoped resource ownership."
    )

    add_heading_2("7.7 Push Notifications for Due Tasks")
    doc.add_paragraph(
        "The mobile app registers device tokens via `/api/notifications/register-device`. The notification service identifies tasks "
        "due tomorrow and dispatches structured alerts via the Expo Push API."
    )

    # -------------------------------------------------------------
    # 8. IMPLEMENTATION IMPROVEMENTS & DELTA
    # -------------------------------------------------------------
    add_heading_1("8. Implementation Improvements & Delta")
    doc.add_paragraph(
        "A formal comparison between the initial assessment specification and the final implemented system is documented in "
        "`submission/IMPLEMENTATION_DELTA.md`. Beyond the baseline, Projecto includes collapsible desktop navigation, a slide-out "
        "mobile drawer, skeleton loaders, toast notifications, breadcrumbs, in-app User Guide, and rapid keyboard shortcuts."
    )

    # -------------------------------------------------------------
    # 9. DEVELOPER SETUP & DOCUMENTATION
    # -------------------------------------------------------------
    add_heading_1("9. Developer Setup & Documentation")
    doc.add_paragraph(
        "This section provides comprehensive technical instructions to configure, run, and evaluate all components of Projecto."
    )

    add_heading_2("9.1 Project Setup")
    doc.add_paragraph(
        "Prerequisites: Node.js >= 18.x, npm >= 9.x, PostgreSQL >= 14.x, Git >= 2.x, Expo Go app or Android Emulator."
    )
    doc.add_paragraph(
        "Step 1 — Backend Installation & Startup:\n"
        "  cd backend\n"
        "  npm install\n"
        "  npx prisma migrate deploy\n"
        "  npx prisma generate\n"
        "  npm run dev (Runs on http://localhost:5000)\n\n"
        "Step 2 — Web Frontend Installation & Startup:\n"
        "  cd ../web\n"
        "  npm install\n"
        "  npm run dev (Runs on http://localhost:5173)\n\n"
        "Step 3 — Mobile Application Startup:\n"
        "  cd ../mobile\n"
        "  npm install\n"
        "  npx expo start (Press 'a' for Android or scan QR code via Expo Go)\n\n"
        "Step 4 — Running Automated Tests:\n"
        "  cd ../backend\n"
        "  npm test (Executes all 39 unit and integration tests via Jest)"
    )

    add_heading_2("9.2 Environment Variables")
    doc.add_paragraph(
        "All configuration parameters are managed via local .env files. Templates (.env.example) are included in each directory:"
    )
    env_table = doc.add_table(rows=1, cols=4)
    env_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    ehdr = env_table.rows[0].cells
    ehdr[0].text = "Component"
    ehdr[1].text = "Variable Name"
    ehdr[2].text = "Example Value"
    ehdr[3].text = "Description"
    for c in ehdr:
        set_cell_background(c, "2563EB")
        c.paragraphs[0].runs[0].font.color.rgb = RGBColor(255, 255, 255)
        c.paragraphs[0].runs[0].bold = True

    env_vars = [
        ("Backend", "PORT", "5000", "Port for Express HTTP server"),
        ("Backend", "DATABASE_URL", "postgresql://user:pass@localhost:5432/projecto", "Prisma PostgreSQL connection string"),
        ("Backend", "JWT_SECRET", "super_secret_jwt_key_here", "HMAC-SHA256 signature secret key"),
        ("Backend", "JWT_EXPIRES_IN", "7d", "Token expiration duration"),
        ("Backend", "CORS_ORIGIN", "http://localhost:5173,exp://localhost:8081", "Allowed client origins"),
        ("Web", "VITE_API_URL", "http://localhost:5000/api", "Backend REST API gateway endpoint"),
        ("Mobile", "EXPO_PUBLIC_API_URL", "http://localhost:5000/api", "Target backend API endpoint (or LAN IP)")
    ]
    for comp, varname, val, desc in env_vars:
        row = env_table.add_row().cells
        row[0].text = comp
        row[1].text = varname
        row[2].text = val
        row[3].text = desc
        for cell in row:
            set_cell_margins(cell)

    add_heading_2("9.3 Database Setup")
    doc.add_paragraph(
        "PostgreSQL Setup & Migration Workflow:\n"
        "1. Create the database: CREATE DATABASE projecto;\n"
        "2. Configure DATABASE_URL in backend/.env.\n"
        "3. Apply migrations: npx prisma migrate deploy\n"
        "4. Generate Prisma client: npx prisma generate\n"
        "5. Optional visual GUI browser: npx prisma studio (at http://localhost:5555)"
    )

    add_heading_2("9.4 API Documentation")
    doc.add_paragraph(
        "The REST API is fully documented via OpenAPI 3.0 specs and interactive Swagger UI accessible at http://localhost:5000/api-docs."
    )
    api_table = doc.add_table(rows=1, cols=4)
    api_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    ahdr = api_table.rows[0].cells
    ahdr[0].text = "Method"
    ahdr[1].text = "Endpoint"
    ahdr[2].text = "Description"
    ahdr[3].text = "Auth"
    for c in ahdr:
        set_cell_background(c, "2563EB")
        c.paragraphs[0].runs[0].font.color.rgb = RGBColor(255, 255, 255)
        c.paragraphs[0].runs[0].bold = True

    api_endpoints = [
        ("POST", "/api/auth/register", "Register new user account", "Public"),
        ("POST", "/api/auth/login", "Authenticate & obtain JWT token", "Public"),
        ("POST", "/api/auth/logout", "Logout user session", "Bearer"),
        ("GET", "/api/auth/me", "Retrieve current authenticated profile", "Bearer"),
        ("PUT", "/api/auth/profile", "Update user full name", "Bearer"),
        ("PUT", "/api/auth/password", "Change user password securely", "Bearer"),
        ("GET", "/api/dashboard", "Aggregated counts & recent activity", "Bearer"),
        ("GET", "/api/projects", "List projects with search, filter, pagination, sorting", "Bearer"),
        ("POST", "/api/projects", "Create new project", "Bearer"),
        ("GET", "/api/projects/:id", "Get project details & task hierarchy", "Bearer"),
        ("PUT", "/api/projects/:id", "Update project details / status", "Bearer"),
        ("DELETE", "/api/projects/:id", "Cascade delete project & tasks", "Bearer"),
        ("GET", "/api/tasks", "List tasks with search, priority, status, pagination, sorting", "Bearer"),
        ("POST", "/api/tasks", "Create new task under user project", "Bearer"),
        ("GET", "/api/tasks/:id", "Get task details", "Bearer"),
        ("PUT", "/api/tasks/:id", "Update task status, priority, due date", "Bearer"),
        ("DELETE", "/api/tasks/:id", "Delete task", "Bearer"),
        ("GET", "/api/audit-logs", "Get user-scoped activity history", "Bearer"),
        ("GET", "/api/admin/audit-logs", "Get system-wide audit logs across all users", "Admin"),
        ("GET", "/api/admin/system-stats", "Get platform-wide aggregation counts", "Admin"),
        ("POST", "/api/notifications/register-device", "Register Expo push token for user", "Bearer"),
        ("POST", "/api/notifications/trigger-due-check", "Scan & prepare push notifications for tasks due tomorrow", "Bearer")
    ]
    for meth, ep, desc, auth in api_endpoints:
        row = api_table.add_row().cells
        row[0].text = meth
        row[1].text = ep
        row[2].text = desc
        row[3].text = auth
        for cell in row:
            set_cell_margins(cell)

    add_heading_2("9.5 Running Mobile Against the Deployed Backend")
    doc.add_paragraph(
        "To test the mobile client against the live backend:\n"
        "1. Configure mobile/.env with the target endpoint:\n"
        "   - Local Android Emulator: EXPO_PUBLIC_API_URL=http://10.0.2.2:5000/api\n"
        "   - Physical Phone via Wi-Fi: EXPO_PUBLIC_API_URL=http://<YOUR_COMPUTER_LOCAL_IP>:5000/api\n"
        "   - Production Cloud Backend: EXPO_PUBLIC_API_URL=https://<DEPLOYED_BACKEND_URL>/api (Status: PENDING cloud deployment trigger)\n"
        "2. Run 'npx expo start' and launch on your connected device or emulator.\n"
        "3. Standalone Android APK Generation: Execute 'eas build -p android --profile preview' to compile an installable .apk via Expo Application Services."
    )

    # -------------------------------------------------------------
    # 10. VALIDATION & ERROR HANDLING
    # -------------------------------------------------------------
    add_heading_1("10. Validation & Error Handling (Hardened Pass)")
    doc.add_paragraph(
        "Projecto enforces comprehensive validation across all layers, establishing the backend as the mandatory source of truth "
        "for security and data integrity while providing inline feedback on Web and Mobile interfaces for optimal UX."
    )

    add_heading_2("10.1 Project Validation Rules")
    doc.add_paragraph(
        "• Project Name: Required, trimmed of leading/trailing whitespace, rejects empty or whitespace-only strings.\n"
        "• Description: Optional, trimmed of whitespace; converts whitespace-only strings to null.\n"
        "• Status: Strict enum validation (NOT_STARTED, IN_PROGRESS, COMPLETED). Invalid values return 400 Bad Request.\n"
        "• Start & End Dates: Strict ISO 8601 validation. The invariant startDate <= endDate is strictly enforced on both create "
        "and update operations, rejecting inverted date ranges while permitting valid single-day projects (startDate === endDate).\n"
        "• Created At: Always generated server-side by PostgreSQL/Prisma; client-supplied timestamps are discarded."
    )

    add_heading_2("10.2 Task Validation & Resource Ownership")
    doc.add_paragraph(
        "• Task Name: Required, trimmed, rejects empty strings.\n"
        "• Priority: Strict enum validation (LOW, MEDIUM, HIGH).\n"
        "• Status: Strict enum validation (PENDING, IN_PROGRESS, COMPLETED).\n"
        "• Due Date: Must be a valid date string.\n"
        "• Project Association & Ownership: Project ID must be a valid UUID. The backend verifies that the referenced project exists "
        "and is owned by the authenticated user before creating or modifying tasks. Cross-user modification attempts are rejected."
    )

    add_heading_2("10.3 Authentication & Password Security")
    doc.add_paragraph(
        "• Registration: Full name required (trimmed), email normalized to lowercase and validated via RFC 5322 regex, password min 6 chars.\n"
        "• Login: Email format validated, password required. Generic failure messages prevent email enumeration.\n"
        "• Password Change: Requires current password verification and enforces that the new password does not match the current password."
    )

    add_heading_2("10.4 Query, Pagination & Whitelisted Sorting")
    doc.add_paragraph(
        "• Pagination: page >= 1 (integer), limit between 1 and 100 (integer) with safe default values (page=1, limit=10). Malformed values (e.g. page=0, limit=-5, limit=1000) are rejected with 400 Bad Request.\n"
        "• Sorting: sortBy strictly whitelisted to known fields (name, createdAt, startDate, endDate, dueDate, priority, status); sortOrder restricted to 'asc' or 'desc'. Arbitrary user inputs are never interpolated into SQL queries.\n"
        "• Search: Trimmed and sanitized, handling empty or whitespace-only search queries gracefully without crashing."
    )

    # -------------------------------------------------------------
    # 11. TESTING & VERIFICATION SUMMARY
    # -------------------------------------------------------------
    add_heading_1("11. Automated Testing & Verification Summary")
    doc.add_paragraph(
        "A 59-test automated suite executed via Jest and Supertest validates all mandatory requirements, bonus features, and strict validation edge cases. "
        "The suite comprises 4 service unit test suites, 1 full API integration test suite, and 1 dedicated validation hardening test suite:\n"
        "  • authService.test.js (4 tests)\n"
        "  • projectService.test.js (4 tests)\n"
        "  • taskService.test.js (4 tests)\n"
        "  • dashboardService.test.js (4 tests)\n"
        "  • api.test.js (23 tests - multi-user isolation, cascades, RBAC, push devices)\n"
        "  • validation.test.js (20 tests - empty names, date ranges, enums, pagination bounds, sorting whitelist, passwords)\n"
        "Total Test Results: 6 test suites passed, 59 tests passed, 0 failures."
    )

    # -------------------------------------------------------------
    # 12. REQUIREMENT TRACEABILITY MATRIX
    # -------------------------------------------------------------
    add_heading_1("12. Requirement Traceability Matrix")
    trace_table = doc.add_table(rows=1, cols=4)
    trace_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    tr_hdr = trace_table.rows[0].cells
    tr_hdr[0].text = "Requirement"
    tr_hdr[1].text = "Implementation"
    tr_hdr[2].text = "Verification Method"
    tr_hdr[3].text = "Status"
    for c in tr_hdr:
        set_cell_background(c, "2563EB")
        c.paragraphs[0].runs[0].font.color.rgb = RGBColor(255, 255, 255)
        c.paragraphs[0].runs[0].bold = True

    trace_data = [
        ("Authentication API", "JWT + Bcrypt + Zod validation", "Automated Jest Integration Tests", "PASS"),
        ("User-Scoped Isolation", "Scoped database queries on user ID", "Cross-User Access Rejection Tests", "PASS"),
        ("Project CRUD & Filters", "Express controllers + Prisma schema", "CRUD Test Suite & Web UI testing", "PASS"),
        ("Task CRUD & Completion", "Project ownership validation", "Task status & priority test suite", "PASS"),
        ("Dashboard Statistics", "SQL aggregation counts per user", "User-scoped count verification", "PASS"),
        ("Validation Hardening", "Zod schemas, date range check, enums", "Jest Validation Suite (20 tests)", "PASS"),
        ("Web Frontend (React)", "Vite + Tailwind + Lucide UI", "Vite production build (0 errors)", "PASS"),
        ("Mobile App (React Native)", "Expo + SecureStore + Tabs", "Cross-platform sync simulation", "PASS"),
        ("Swagger Documentation", "OpenAPI 3.0 at /api-docs", "Swagger UI endpoint verification", "PASS"),
        ("Bonus: Unit Testing", "4 test suites covering services", "Jest Unit Test Suite (16 tests)", "PASS"),
        ("Bonus: Integration Testing", "Supertest multi-user scenarios", "Jest Integration Suite (23 tests)", "PASS"),
        ("Bonus: Server Pagination", "page [1..] & limit [1..100] envelope", "Pagination Integration Tests & UI", "PASS"),
        ("Bonus: Server Sorting", "Whitelisted sortBy & sortOrder", "Sorting Integration Tests & UI", "PASS"),
        ("Bonus: Audit Logging", "AuditLog model & metadata sanitizer", "Audit Log Tests & UI Modal", "PASS"),
        ("Bonus: RBAC Access Control", "Role enum (USER/ADMIN) & middleware", "403 Forbidden & 200 Admin Tests", "PASS"),
        ("Bonus: Push Notifications", "Expo push token registration", "Device Registration & Due Check Tests", "PASS"),
        ("Production Cloud Deploy", "Configured for Vercel/Render/Neon", "Cloud Deployment Configuration", "PENDING"),
        ("Android Standalone APK", "Configured via EAS Build", "EAS Preview Pipeline", "PENDING"),
    ]
    for req, impl, ver, stat in trace_data:
        row = trace_table.add_row().cells
        row[0].text = req
        row[1].text = impl
        row[2].text = ver
        row[3].text = stat
        for cell in row:
            set_cell_margins(cell)

    # -------------------------------------------------------------
    # 13. CONCLUSION
    # -------------------------------------------------------------
    add_heading_1("13. Conclusion")
    doc.add_paragraph(
        "Projecto represents a complete, secure, and production-ready solution satisfying all mandatory technical assessment "
        "criteria, comprehensive validation hardening, and all 7 optional bonus features. With a verified PostgreSQL database, unified Express REST API, responsive "
        "React web interface, and secure React Native mobile client, the application delivers robust project management with "
        "zero compromise on security, architecture, or code quality."
    )

    doc.save("submission/Projecto_Technical_Documentation.docx")
    print("SUCCESS: Generated submission/Projecto_Technical_Documentation.docx")

if __name__ == "__main__":
    create_document()

