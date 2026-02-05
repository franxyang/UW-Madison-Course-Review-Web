# WiscFlow 数据提取任务文档

**项目**: WiscFlow - UW Madison 课程评价平台  
**文档版本**: 1.0  
**创建日期**: 2026-02-04  
**目标**: 为另一个 Agent 提供完整的数据提取指南

---

## 📋 任务概述

WiscFlow 需要从 Madgrades 数据源导入 UW Madison 的课程成绩分布数据，包括：
- 每门课程的历史成绩分布
- 每个学期的数据
- **每个教师**对应的成绩分布（关键需求）

---

## 🎯 数据需求规格

### 1. 课程成绩分布 (GradeDistribution)

**用途**: 显示每门课程每个学期的整体成绩分布

| 字段 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `courseCode` | String | ✅ | 课程代码，如 "COMP SCI 577" |
| `term` | String | ✅ | 学期，格式 "YYYY-Season"，如 "2024-Fall" |
| `aCount` | Int | ✅ | 获得 A 的人数 |
| `abCount` | Int | ✅ | 获得 AB 的人数 |
| `bCount` | Int | ✅ | 获得 B 的人数 |
| `bcCount` | Int | ✅ | 获得 BC 的人数 |
| `cCount` | Int | ✅ | 获得 C 的人数 |
| `dCount` | Int | ✅ | 获得 D 的人数 |
| `fCount` | Int | ✅ | 获得 F 的人数 |
| `totalGraded` | Int | ✅ | 总人数（计入 GPA 的） |
| `avgGPA` | Float | ✅ | 平均 GPA（计算方式见下） |

**GPA 计算公式**:
```
avgGPA = (4.0*aCount + 3.5*abCount + 3.0*bCount + 2.5*bcCount + 2.0*cCount + 1.0*dCount + 0.0*fCount) / totalGraded
```

---

### 2. 教师成绩分布 (InstructorGradeDistribution) ⭐ 关键需求

**用途**: 显示某个教师在某门课程某个学期的成绩分布

| 字段 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `courseCode` | String | ✅ | 课程代码 |
| `instructorName` | String | ✅ | 教师姓名（标准化后） |
| `term` | String | ✅ | 学期 |
| `aCount` | Int | ✅ | A 人数 |
| `abCount` | Int | ✅ | AB 人数 |
| `bCount` | Int | ✅ | B 人数 |
| `bcCount` | Int | ✅ | BC 人数 |
| `cCount` | Int | ✅ | C 人数 |
| `dCount` | Int | ✅ | D 人数 |
| `fCount` | Int | ✅ | F 人数 |
| `totalGraded` | Int | ✅ | 总人数 |
| `avgGPA` | Float | ✅ | 平均 GPA |

---

### 3. 教师列表 (Instructors)

**用途**: 教师信息，用于关联成绩数据

| 字段 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `name` | String | ✅ | 教师姓名（主名称） |
| `aliases` | String[] | ❌ | 别名列表（同一教师不同写法） |

---

### 4. 课程-教师关联 (CourseInstructor)

**用途**: 记录哪些教师教过哪些课程

| 字段 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `courseCode` | String | ✅ | 课程代码 |
| `instructorName` | String | ✅ | 教师姓名 |
| `terms` | String[] | ❌ | 教过的学期列表 |

---

## 📦 数据来源

### 主要来源：Madgrades

**GitHub 仓库**:
- 数据提取工具: https://github.com/Madgrades/madgrades-extractor
- API 后端: https://github.com/Madgrades/api.madgrades.com
- 前端: https://github.com/Madgrades/madgrades.com

**原始数据**:
- UW Registrar 官方报告: https://registrar.wisc.edu/grade-reports/
- Kaggle 数据集: https://www.kaggle.com/datasets/Madgrades/uw-madison-courses

### Madgrades 数据结构

```
Madgrades 表结构：

courses
├── uuid (PK)
├── number (课程编号)
└── name (课程名称)

course_offerings
├── uuid (PK)
├── course_uuid (FK → courses)
├── term_code (学期代码，如 1252 = 2025 Spring)
└── name

sections
├── uuid (PK)
├── course_offering_uuid (FK → course_offerings)
├── section_type
└── number

teachings (教师-section 关联)
├── section_uuid (FK → sections)
└── instructor_id (FK → instructors)

instructors
├── id (PK)
└── name

grade_distributions (section 级别成绩)
├── course_offering_uuid
├── section_number
├── a_count, ab_count, b_count, bc_count, c_count, d_count, f_count
└── gpa

instructor_grade_dists ⭐ (教师级别成绩聚合)
├── course_uuid
├── instructor_id
├── term_code
├── a_count, ab_count, b_count, bc_count, c_count, d_count, f_count
└── (需要计算 gpa)

subject_memberships (课程-学科关联)
├── subject_code (如 "COMP SCI")
└── course_offering_uuid
```

### 学期代码转换

Madgrades 使用数字学期代码，需要转换：

```
term_code 格式：YYYS
- YYY = year offset from 1900 (e.g., 125 = 2025)
- S = season (2=Fall, 4=Spring, 6=Summer)

示例：
- 1252 → 2025 Spring
- 1246 → 2024 Summer  
- 1242 → 2024 Fall
- 1234 → 2023 Spring

转换公式：
year = 1900 + (term_code / 10)
season_code = term_code % 10
  - 2 → "Fall" (上一年)
  - 4 → "Spring"
  - 6 → "Summer"

特别注意：Fall 学期属于前一个日历年
- 1252 season=2 → Fall 2024 (not 2025)
```

---

## 📁 输出文件格式

请提取数据并输出为以下 JSON 文件：

### 1. `grade_distributions.json`

```json
[
  {
    "courseCode": "COMP SCI 577",
    "term": "2024-Fall",
    "aCount": 45,
    "abCount": 30,
    "bCount": 25,
    "bcCount": 10,
    "cCount": 8,
    "dCount": 3,
    "fCount": 2,
    "totalGraded": 123,
    "avgGPA": 3.42
  },
  ...
]
```

### 2. `instructor_grade_distributions.json` ⭐

```json
[
  {
    "courseCode": "COMP SCI 577",
    "instructorName": "Hobbes LeGault",
    "term": "2024-Fall",
    "aCount": 25,
    "abCount": 15,
    "bCount": 12,
    "bcCount": 5,
    "cCount": 3,
    "dCount": 1,
    "fCount": 1,
    "totalGraded": 62,
    "avgGPA": 3.51
  },
  ...
]
```

### 3. `instructors.json`

```json
[
  {
    "name": "Hobbes LeGault",
    "aliases": ["H LeGault", "Hobbes Legault"]
  },
  {
    "name": "Jim Williams",
    "aliases": ["James Williams", "J Williams"]
  },
  ...
]
```

### 4. `course_instructors.json`

```json
[
  {
    "courseCode": "COMP SCI 577",
    "instructorName": "Hobbes LeGault",
    "terms": ["2024-Fall", "2024-Spring", "2023-Fall"]
  },
  ...
]
```

---

## 🔧 数据提取步骤

### 方法 A：使用 Madgrades Extractor（推荐）

1. **克隆仓库**
   ```bash
   git clone https://github.com/Madgrades/madgrades-extractor.git
   cd madgrades-extractor
   ```

2. **构建工具**
   ```bash
   mvn clean install
   ```

3. **下载并提取数据**
   ```bash
   # 提取所有学期的数据到 CSV
   java -jar target/madgrades-extractor-*.jar -f CSV -o ./output
   ```

4. **处理 CSV 文件**
   - `courses.csv`
   - `course_offerings.csv`
   - `sections.csv`
   - `teachings.csv`
   - `instructors.csv`
   - `grade_distributions.csv`
   - `subject_memberships.csv`

5. **聚合计算**
   - 从 `grade_distributions` + `sections` + `teachings` 聚合计算 `instructor_grade_distributions`
   - 关联 `subject_memberships` 获取课程代码（如 "COMP SCI 577"）

### 方法 B：使用 Kaggle 数据集

1. **下载数据集**
   - 访问: https://www.kaggle.com/datasets/Madgrades/uw-madison-courses
   - 下载 CSV 文件

2. **处理数据**
   - 按照上述步骤 4-5 处理

### 方法 C：调用 Madgrades API

1. **获取 API Token**
   - 访问: https://api.madgrades.com
   - 注册并获取 API token

2. **调用 API**
   ```bash
   # 获取课程列表
   curl -H "Authorization: Token YOUR_TOKEN" \
     "https://api.madgrades.com/v1/courses"
   
   # 获取某课程的成绩分布
   curl -H "Authorization: Token YOUR_TOKEN" \
     "https://api.madgrades.com/v1/courses/{uuid}/grades"
   ```

---

## 🔗 数据关联逻辑

### 构建课程代码

Madgrades 使用 `course_uuid` + `subject_memberships` 来构建完整课程代码：

```python
# 伪代码
def get_course_code(course_uuid, course_offering_uuid):
    # 1. 从 subject_memberships 获取 subject_code
    subject_code = query("""
        SELECT subject_code FROM subject_memberships 
        WHERE course_offering_uuid = ?
    """, course_offering_uuid)
    
    # 2. 从 courses 获取课程编号
    course_number = query("""
        SELECT number FROM courses WHERE uuid = ?
    """, course_uuid)
    
    # 3. 组合成课程代码
    return f"{subject_code} {course_number}"  # e.g., "COMP SCI 577"
```

### 构建教师成绩分布

```python
# 伪代码：聚合每个教师在某课程某学期的成绩
def build_instructor_grade_dist():
    results = query("""
        SELECT 
            c.uuid as course_uuid,
            co.term_code,
            i.id as instructor_id,
            i.name as instructor_name,
            SUM(gd.a_count) as a_count,
            SUM(gd.ab_count) as ab_count,
            SUM(gd.b_count) as b_count,
            SUM(gd.bc_count) as bc_count,
            SUM(gd.c_count) as c_count,
            SUM(gd.d_count) as d_count,
            SUM(gd.f_count) as f_count
        FROM courses c
        JOIN course_offerings co ON co.course_uuid = c.uuid
        JOIN sections s ON s.course_offering_uuid = co.uuid
        JOIN teachings t ON t.section_uuid = s.uuid
        JOIN instructors i ON i.id = t.instructor_id
        JOIN grade_distributions gd ON gd.course_offering_uuid = co.uuid 
            AND gd.section_number = s.number
        GROUP BY c.uuid, co.term_code, i.id
    """)
    
    # 计算 GPA
    for row in results:
        total = sum([row.a_count, row.ab_count, ...])
        gpa = (4*row.a_count + 3.5*row.ab_count + ...) / total
        row.avg_gpa = round(gpa, 2)
    
    return results
```

---

## ✅ 验证标准

### 数据完整性检查

1. **课程覆盖率**
   - [ ] 至少覆盖 WiscFlow 现有的 10,174 门课程中的 80%+
   - [ ] 每门课程至少有 1 个学期的数据

2. **学期范围**
   - [ ] 至少包含最近 5 年的数据（2020-2024）
   - [ ] 每年至少有 Fall 和 Spring 两个学期

3. **教师数据**
   - [ ] 每门有成绩数据的课程至少关联 1 个教师
   - [ ] 教师姓名已标准化（无重复）

4. **数值正确性**
   - [ ] 所有 count 字段 >= 0
   - [ ] totalGraded = sum(aCount + abCount + ... + fCount)
   - [ ] 0.0 <= avgGPA <= 4.0

### 格式验证

```bash
# 验证 JSON 格式
python -m json.tool grade_distributions.json > /dev/null && echo "Valid JSON"

# 检查必需字段
jq 'map(has("courseCode", "term", "avgGPA")) | all' grade_distributions.json
```

---

## 📊 预期数据量

| 数据类型 | 预期记录数 | 文件大小估计 |
|----------|------------|--------------|
| `grade_distributions.json` | 50,000 - 100,000 | 10-20 MB |
| `instructor_grade_distributions.json` | 100,000 - 200,000 | 20-40 MB |
| `instructors.json` | 3,000 - 5,000 | 0.5 MB |
| `course_instructors.json` | 20,000 - 40,000 | 3-5 MB |

---

## 🚀 交付清单

完成后请提供：

1. **数据文件**
   - [ ] `grade_distributions.json`
   - [ ] `instructor_grade_distributions.json`
   - [ ] `instructors.json`
   - [ ] `course_instructors.json`

2. **元数据**
   - [ ] 数据提取日期
   - [ ] 数据来源版本
   - [ ] 学期范围（最早 - 最晚）
   - [ ] 记录数统计

3. **处理脚本**
   - [ ] 提取脚本源码
   - [ ] 运行说明

4. **问题报告**
   - [ ] 任何数据质量问题
   - [ ] 未能匹配的课程/教师
   - [ ] 建议的改进

---

## 📍 WiscFlow 项目路径

数据文件放置位置：
```
~/Desktop/wiscflow/data/madgrades/
├── grade_distributions.json
├── instructor_grade_distributions.json
├── instructors.json
├── course_instructors.json
└── metadata.json
```

导入脚本位置：
```
~/Desktop/wiscflow/scripts/
├── importMadgradesData.ts  (待创建)
└── validateMadgradesData.ts (待创建)
```

---

## 📞 联系信息

如有问题，请在 Discord 的 `#Course Evaluation Web development` 频道联系 Franx。

---

**文档结束**

*此文档由 dev-agent 创建，供数据提取 agent 使用。*
