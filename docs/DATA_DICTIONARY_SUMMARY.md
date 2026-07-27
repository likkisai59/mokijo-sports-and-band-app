# BandConnect — Database Data Dictionary Summary (v3.0)

> **Document Classification**: OFFICIAL — Enterprise Database Reference
> **Status**: APPROVED — Ready for Manager Submission
> **Alembic HEAD Revision**: `9f956581e2de`
> **Last Upgraded**: 2026-07-16
> **Source of Truth**: Live PostgreSQL + SQLAlchemy Models + Alembic Migrations

---

## Executive Metrics

| Metric | Value | Architectural Purpose / Description |
|--------|-------|-------------------------------------|
| **Total Sheets** | **37** | 13 infrastructure/analysis sheets + 24 table sheets. |
| **Total Tables** | **24** | 18 entity tables, 5 junction tables, 1 migration metadata table. |
| **Total Columns** | **210** | Documented database columns across all schemas. |
| **Total Foreign Keys** | **29** | Referential integrity constraints. |
| **Total Indexes** | **82** | standard B-tree indexes including primary key and unique constraints. |
| **Unique Constraints** | **10** | Non-PK unique columns. |
| **Check Constraints** | **103** | NOT NULL checks and user-defined validation checks. |
| **Sequences** | **1** | `venue_number_seq` for generating unique venue BCV numbers. |
| **Active Schema Status** | **100% Synced** | Live PostgreSQL matches dictionary catalog. |
| **Column Properties Mapped** | **59** | 59 detailed business & code-level metadata parameters per column. |

---

## Formatting & Design System Rules (v3.0)

The workbook `BandConnect_Data_Dictionary.xlsx` has been regenerated to follow these guidelines:
- **Font**: Calibri, 11pt for main headers/titles, 10pt for cells.
- **Main Headers**: Dark Blue background (`#1B2A4A`), White Bold text, aligned center.
- **Borders**: Thin borders (`#CCCCCC`) for all cells, thick borders (`#999999`) for column headers.
- **Layout**: Freeze panes enabled (`B14` for table sheets, allowing headers freeze), Auto-filter enabled on list views.
- **Alternating Rows**: Alternate row shading using `#F5F5F5` and `#FFFFFF` for readability.
- **Auto-Width**: Column widths set to prevent text truncation.

### Conditional Formatting Rules
- **Primary Keys (PK)**: Shaded in Light Green (`#D4EDDA`).
- **Foreign Keys (FK)**: Shaded in Light Yellow (`#FFF3CD`).
- **Unique Columns**: Shaded in Light Purple (`#EDE7F6`).
- **Non-Nullable Columns (NOT NULL)**: Shaded in Light Red (`#FDECEA`).

### Data Classification Color System
- **Public** → Light Green (`#E8F5E9` text color `#2E7D32`)
- **Internal** → Light Blue (`#E3F2FD` text color `#1565C0`)
- **PII** → Light Orange (`#FFF3E0` text color `#E65100`)
- **Sensitive Authentication** → Light Red (`#FFEBEE` text color `#C62828`)
- **Financial** → Light Yellow (`#FFFDE7` text color `#F57F17`)
- **Verification Documents** → Light Purple (`#F3E5F5` text color `#6A1B9A`)
- **System Metadata** → Grey (`#F5F5F5` text color `#424242`)

---

## Workbook Sheet Guide

### 1. Infrastructure and Analysis Sheets (13)

| Sheet | Row Count | Purpose |
|-------|-----------|---------|
| `01_README` | — | Document metadata, audience, revision history, and architecture rules. |
| `02_VERSION_HISTORY` | 6 | Tracks historical schema changes and associated Alembic revisions. |
| `03_TABLE_SUMMARY` | 24 | Tabular view of all tables, modules, row counts, and schema metrics. |
| `04_RELATIONSHIPS` | 29 | Comprehensive map of all parent-child links with delete rules. |
| `05_PRIMARY_KEYS` | 24 | Documentation of all primary key selections and UUID rationales. |
| `06_FOREIGN_KEYS` | 29 | Foreign key constraints, target tables, delete cascading rules. |
| `07_UNIQUE_CONSTRAINTS` | 10 | Non-primary unique columns and business rules. |
| `08_INDEXES` | 82 | Full inventory of database indexes to verify scan speed optimizations. |
| `09_CHECK_CONSTRAINTS` | 103 | Checks and validations applied at DB constraints level. |
| `10_SEQUENCES` | 1 | Details on `venue_number_seq` for BCV number generation. |
| `11_DATA_CLASSIFICATION` | 16 | Classification rules for PII, Financial, and Sensitive data. |
| `12_DATA_QUALITY_AUDIT` | 16 | Quality check scorecard, timezones, plain-text location warnings. |
| `13_GLOSSARY` | 28 | Technical definitions of data types and architecture patterns. |

### 2. Table-Specific Sheets (24)

Every single PostgreSQL table is represented by a worksheet. Each sheet includes a table-level metadata section mapping owners, row count, API endpoints, and a column matrix with **59 documented fields**:
1. S.No
2. Column Name
3. Business Label
4. Business Description
5. Why This Column Exists
6. Business Importance
7. PostgreSQL Data Type
8. Exact Database Type
9. Length
10. Precision
11. Scale
12. Nullable
13. Default Value
14. Auto Generated
15. Primary Key
16. Why This is Primary Key
17. Foreign Key
18. Why This is Foreign Key
19. Foreign Key Reference
20. Parent Table
21. Parent Column
22. Child Tables
23. Relationship Type
24. Unique
25. Why Unique
26. Indexed
27. Index Name
28. Check Constraint
29. Sequence
30. Validation Rule
31. Business Rule
32. Allowed Values
33. Example Value
34. Example Record
35. Frontend Pages Using This Column
36. Backend APIs Using This Column
37. Backend Services Using This Column
38. Repository Methods Using This Column
39. Business Flow Using This Column
40. Reports Using This Column
41. Search Using This Column
42. Filters Using This Column
43. Sorting Using This Column
44. Export Using This Column
45. Security Classification
46. PII Classification
47. Encryption Required
48. Audit Required
49. Editable
50. Read Only
51. System Generated
52. Created By Migration
53. Modified By Migration
54. Business Owner
55. Technical Owner
56. Impact if Removed
57. Dependencies
58. Future Enhancements
59. Remarks

---

## Core Architecture Compliance Rules

1. **UUID Rationale**: Primary keys on entity tables use randomly generated UUIDs (`uuid.uuid4()`) to prevent ID enumeration attacks, allow decentralized key generation, and simplify future sharding/scaling.
2. **Junction Table Natural Composite Keys**: Junction tables (`user_roles`, `role_permissions`, `artist_genres`, `artist_languages`, `venue_categories`) do not use surrogate keys; they use natural composite keys of their respective foreign keys.
3. **Location Normalization**: Venues must link to normalized cities via `city_id` with `ON DELETE RESTRICT` to protect mapping integrity.
4. **Change Control**: When database modifications are required, this Data Dictionary must be updated first, followed by Alembic migrations and SQLAlchemy models. Validation via `gen_dict.py` ensures 100% synchronization.
