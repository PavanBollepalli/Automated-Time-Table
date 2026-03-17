# UML Diagrams – Automated Timetable System (IntelliScheduler)

All diagrams are written in PlantUML. Paste each block into https://www.plantuml.com/plantuml/uml/ or any PlantUML renderer.

---

## 1. System Architecture Diagram (C4 Context)

```plantuml
@startuml System_Architecture
!define C4_CONTEXT
skinparam backgroundColor #FAFAFA
skinparam defaultFontName Helvetica
skinparam componentStyle rectangle

title IntelliScheduler – System Architecture

actor "Admin / DEO" as Admin
actor "Faculty" as Faculty
actor "Student" as Student

rectangle "IntelliScheduler System" {

  package "Frontend (Next.js 14 + TypeScript)" as FE #LightBlue {
    component "Auth Pages\n(Login / Signup)" as AuthPages
    component "Admin Dashboard\n(Courses, Faculty,\nRooms, Programs,\nSchedule, Generate)" as AdminDash
    component "DEO Dashboard\n(Manage Data,\nTrigger Gen)" as DeoDash
    component "Faculty Dashboard\n(View Timetable)" as FacDash
    component "Student Dashboard\n(View Timetable)" as StudDash
    component "AI Chatbot\n(IntelliScheduler AI)" as Chatbot
    component "Timetable Grid\n& List View" as TTGrid
    component "AuthContext\n(React Context)" as AuthCtx
    component "API Client\n(Axios)" as Axios
  }

  package "Backend (FastAPI + Python)" as BE #LightGreen {
    component "main.py\n(App Entrypoint,\nCORS, Lifespan)" as Main
    component "API Router v1\n(/api/v1)" as Router
    
    package "API Endpoints" as Endpoints {
      component "login.py" as Login
      component "users.py\nuser_management.py" as Users
      component "programs.py" as Programs
      component "courses.py" as Courses
      component "faculty.py" as FacultyEP
      component "infrastructure.py" as Infra
      component "timetables.py" as TimetablesEP
      component "generator.py" as GenEP
      component "ai.py" as AIEP
    }

    package "Services" as Services {
      component "TimetableGenerator\n(Genetic Algorithm)" as GAService
      component "ExportService\n(PDF / Excel)" as ExportSvc
    }

    package "Core" as Core {
      component "config.py\n(Settings / .env)" as Config
      component "security.py\n(JWT / bcrypt)" as Security
      component "deps.py\n(OAuth2 Guards)" as Deps
    }

    package "Models (Beanie / MongoDB ODM)" as Models {
      component "User" as MUser
      component "Program / Batch\n/ Semester / Section" as MProg
      component "Course" as MCourse
      component "Faculty" as MFaculty
      component "Room" as MRoom
      component "Timetable\nScheduleConfig" as MTimetable
      component "Student" as MStudent
    }
  }

  database "MongoDB Atlas / Local\n(timetable_db)" as DB #LightYellow {
    collections "users\nprograms / batches\nsemesters / sections\ncourses\nfaculty\nrooms\ntimetables\nschedule_configs\nstudents" as Collections
  }

  cloud "Groq Cloud API\n(llama-3.3-70b)" as Groq #LightPink
}

' Connections
Admin --> AuthPages
Faculty --> AuthPages
Student --> AuthPages
AuthPages --> Axios
AdminDash --> Axios
DeoDash --> Axios
FacDash --> Axios
StudDash --> Axios
Chatbot --> Axios
Axios --> Router : "HTTPS REST\nBearer JWT"
Router --> Login
Router --> Users
Router --> Programs
Router --> Courses
Router --> FacultyEP
Router --> Infra
Router --> TimetablesEP
Router --> GenEP
Router --> AIEP
GenEP --> GAService
TimetablesEP --> ExportSvc
Deps --> Security
Login --> Security
Models --> DB
AIEP --> Groq : "HTTPS API"

@enduml
```

---

## 2. Class Diagram – Domain Models

```plantuml
@startuml Class_Diagram
skinparam classAttributeIconSize 0
skinparam classFontSize 12
skinparam defaultFontName Helvetica
title IntelliScheduler – Domain Class Diagram

class User {
  +id: ObjectId
  +email: EmailStr <<unique>>
  +hashed_password: str
  +full_name: str?
  +role: str  <<admin|faculty|student|deo>>
  +is_active: bool
  +created_at: datetime
}

class Program {
  +id: ObjectId
  +name: str
  +code: str
  +type: str <<UG|PG|FYUP|ITE>>
  +duration_years: int
}

class Batch {
  +id: ObjectId
  +name: str
  +start_year: int
  +end_year: int
}

class Semester {
  +id: ObjectId
  +name: str
  +number: int
  +is_active: bool
}

class Section {
  +id: ObjectId
  +name: str
  +student_count: int
}

class Course {
  +id: ObjectId
  +code: str
  +name: str
  +credits: int
  +type: str <<Major|Minor|Value-Added|SKill-Enhancement|Ability-Enhancement>>
  +is_elective: bool
}

class CourseComponent {
  +lecture: int
  +tutorial: int
  +practical: int
}

class Faculty {
  +id: ObjectId
  +name: str
  +email: EmailStr
  +department: str
  +designation: str
  +max_load_hours: int
  +current_load_hours: int
}

class TimeSlot {
  +day: str
  +periods: List[int]
}

class Room {
  +id: ObjectId
  +name: str
  +capacity: int
  +type: str <<Lecture|Lab|Seminar>>
  +features: List[str]
}

class Student {
  +id: ObjectId
  +name: str
  +student_id: str <<unique>>
}

class Timetable {
  +id: ObjectId
  +entries: List[TimetableEntry]
  +is_draft: bool
  +created_at: datetime
}

class TimetableEntry {
  +entry_id: str
  +day: str
  +period: int
  +course_id: str
  +course_name: str
  +faculty_id: str
  +faculty_name: str
  +room_id: str
  +room_name: str
  +batch_id: str
  +section_id: str
  +section_name: str
}

class ScheduleConfig {
  +id: ObjectId
  +name: str
  +start_time: str
  +period_duration_minutes: int
  +periods_per_day: int
  +working_days: List[str]
}

class BreakSlot {
  +after_period: int
  +duration_minutes: int
  +name: str
}

' Relationships
Program "1" *-- "many" Batch : has
Batch "1" *-- "many" Section : has
Batch "many" --> "1" Semester : current_semester
Course "many" --> "1" Program : belongs to
Course "many" --> "1" Semester : belongs to
Course "1" *-- "1" CourseComponent : components
Faculty "many" --> "many" Course : can_teach
Faculty "1" *-- "many" TimeSlot : busy_slots
Student "many" --> "1" Batch
Student "many" --> "many" Course : chosen_electives
Timetable "1" *-- "many" TimetableEntry : entries
Timetable "many" --> "1" Program
Timetable "many" --> "1" Batch
Timetable "many" --> "1" Semester
Timetable "many" --> "0..1" Section
ScheduleConfig "1" *-- "many" BreakSlot : breaks
ScheduleConfig "many" --> "0..1" Semester

@enduml
```

---

## 3. Entity Relationship Diagram (MongoDB Collections)

```plantuml
@startuml ERD
skinparam defaultFontName Helvetica
title IntelliScheduler – Entity Relationship Diagram (MongoDB)

entity "users" as users {
  * _id : ObjectId <<PK>>
  --
  email : String <<unique>>
  hashed_password : String
  full_name : String
  role : String
  is_active : Boolean
  created_at : DateTime
}

entity "programs" as programs {
  * _id : ObjectId <<PK>>
  --
  name : String
  code : String
  type : String
  duration_years : Int
  batches[] : Ref<batches>
}

entity "batches" as batches {
  * _id : ObjectId <<PK>>
  --
  name : String
  start_year : Int
  end_year : Int
  current_semester : Ref<semesters>
  sections[] : Ref<sections>
}

entity "semesters" as semesters {
  * _id : ObjectId <<PK>>
  --
  name : String
  number : Int
  is_active : Boolean
}

entity "sections" as sections {
  * _id : ObjectId <<PK>>
  --
  name : String
  student_count : Int
}

entity "courses" as courses {
  * _id : ObjectId <<PK>>
  --
  code : String
  name : String
  credits : Int
  type : String
  components.lecture : Int
  components.tutorial : Int
  components.practical : Int
  program : Ref<programs>
  semester : Ref<semesters>
  is_elective : Boolean
}

entity "faculty" as faculty {
  * _id : ObjectId <<PK>>
  --
  name : String
  email : String
  department : String
  designation : String
  max_load_hours : Int
  current_load_hours : Int
  can_teach[] : Ref<courses>
  busy_slots[] : TimeSlot
}

entity "rooms" as rooms {
  * _id : ObjectId <<PK>>
  --
  name : String
  capacity : Int
  type : String
  features[] : String
}

entity "students" as students {
  * _id : ObjectId <<PK>>
  --
  name : String
  student_id : String <<unique>>
  batch : Ref<batches>
  chosen_electives[] : Ref<courses>
}

entity "timetables" as timetables {
  * _id : ObjectId <<PK>>
  --
  program : Ref<programs>
  batch : Ref<batches>
  semester : Ref<semesters>
  section : Ref<sections>
  entries[] : TimetableEntry
  is_draft : Boolean
  created_at : DateTime
}

entity "schedule_configs" as schedule_configs {
  * _id : ObjectId <<PK>>
  --
  name : String
  semester : Ref<semesters>
  start_time : String
  period_duration_minutes : Int
  periods_per_day : Int
  working_days[] : String
  breaks[] : BreakSlot
}

programs ||--o{ batches : "has"
batches ||--o{ sections : "has"
batches }o--|| semesters : "current_semester"
courses }o--|| programs : "belongs to"
courses }o--|| semesters : "belongs to"
faculty }o--o{ courses : "can_teach"
students }o--|| batches : "enrolled in"
students }o--o{ courses : "chosen_electives"
timetables }o--|| programs : "for"
timetables }o--|| batches : "for"
timetables }o--|| semesters : "for"
timetables }o--o| sections : "for"
schedule_configs }o--o| semesters : "scoped to"

@enduml
```

---

## 4. Use Case Diagram

```plantuml
@startuml Use_Case_Diagram
left to right direction
skinparam defaultFontName Helvetica
skinparam actorStyle awesome
title IntelliScheduler – Use Case Diagram

actor "Admin" as Admin
actor "DEO\n(Data Entry Officer)" as DEO
actor "Faculty" as Faculty
actor "Student" as Student
actor "Groq AI\nService" as AI <<system>>
actor "MongoDB" as DB <<system>>

rectangle "IntelliScheduler System" {

  package "Authentication" {
    usecase "Login" as UC_Login
    usecase "Signup" as UC_Signup
    usecase "Logout" as UC_Logout
  }

  package "User Management" {
    usecase "Create / Edit / Delete Users" as UC_Users
    usecase "Assign Roles" as UC_Roles
    usecase "View All Users" as UC_ViewUsers
  }

  package "Academic Data Management" {
    usecase "Manage Programs\n(CRUD)" as UC_Programs
    usecase "Manage Batches &\nSections" as UC_Batches
    usecase "Manage Semesters" as UC_Semesters
    usecase "Manage Courses\n(CRUD + Components)" as UC_Courses
    usecase "Manage Faculty\n(CRUD + Workload)" as UC_Faculty
    usecase "Manage Rooms\n(CRUD)" as UC_Rooms
    usecase "Set Schedule Config\n(Timings, Breaks)" as UC_ScheduleConf
  }

  package "Timetable Operations" {
    usecase "Generate Timetable\n(GA Engine)" as UC_Generate
    usecase "View Timetable\n(Grid / List)" as UC_ViewTT
    usecase "Edit Timetable\nEntry" as UC_EditTT
    usecase "Publish / Approve\nTimetable" as UC_Publish
    usecase "Export Timetable\n(PDF / Excel)" as UC_Export
    usecase "Simulate Timetable" as UC_Simulate
  }

  package "AI Features" {
    usecase "Chat with AI\n(IntelliScheduler AI)" as UC_Chat
    usecase "AI Analysis of\nTimetable Quality" as UC_Analysis
    usecase "AI Dashboard\nInsights" as UC_Insights
  }

  package "Student / Faculty Self Service" {
    usecase "View Own Timetable" as UC_Own
    usecase "Choose Electives" as UC_Electives
  }
}

' Admin associations
Admin --> UC_Login
Admin --> UC_Users
Admin --> UC_Roles
Admin --> UC_ViewUsers
Admin --> UC_Programs
Admin --> UC_Batches
Admin --> UC_Semesters
Admin --> UC_Courses
Admin --> UC_Faculty
Admin --> UC_Rooms
Admin --> UC_ScheduleConf
Admin --> UC_Generate
Admin --> UC_ViewTT
Admin --> UC_EditTT
Admin --> UC_Publish
Admin --> UC_Export
Admin --> UC_Chat
Admin --> UC_Analysis
Admin --> UC_Insights
Admin --> UC_Simulate

' DEO associations
DEO --> UC_Login
DEO --> UC_Programs
DEO --> UC_Batches
DEO --> UC_Semesters
DEO --> UC_Courses
DEO --> UC_Faculty
DEO --> UC_Rooms
DEO --> UC_Generate
DEO --> UC_ViewTT
DEO --> UC_EditTT
DEO --> UC_Export
DEO --> UC_Chat
DEO --> UC_Analysis

' Faculty associations
Faculty --> UC_Login
Faculty --> UC_Own
Faculty --> UC_Chat

' Student associations
Student --> UC_Login
Student --> UC_Signup
Student --> UC_Own
Student --> UC_Electives
Student --> UC_Chat

' System associations
UC_Chat --> AI
UC_Analysis --> AI
UC_Insights --> AI
UC_Generate --> DB
UC_Login --> DB

@enduml
```

---

## 5. Sequence Diagram – Authentication (Login Flow)

```plantuml
@startuml Seq_Auth
skinparam defaultFontName Helvetica
title Authentication – Login Sequence

actor "User\n(Browser)" as User
participant "Next.js\nFrontend" as FE
participant "AuthContext\n(React)" as Ctx
participant "Axios\nAPI Client" as Axios
participant "FastAPI\n/api/v1/login" as BE
participant "security.py\n(JWT + bcrypt)" as Sec
database "MongoDB\nusers" as DB

User -> FE : Enter email + password\n& click Login
FE -> Axios : loginUser(email, password)
Axios -> BE : POST /api/v1/login\n{ email, password }
BE -> DB : User.find_one(email)
DB --> BE : User document
BE -> Sec : verify_password(plain, hashed)
Sec --> BE : True / False
alt Invalid credentials
  BE --> Axios : 400 Incorrect email or password
  Axios --> FE : Error
  FE --> User : Show error toast
else Valid credentials
  BE -> Sec : create_access_token(user.id, role)
  Sec --> BE : JWT token
  BE --> Axios : 200 { access_token, role,\nemail, full_name }
  Axios --> FE : Response data
  FE -> Ctx : login(token, role, email, full_name)
  Ctx -> Ctx : Save to localStorage
  Ctx -> FE : Route to role dashboard\n(/admin | /faculty |\n/student | /deo)
  FE --> User : Redirect to Dashboard
end

@enduml
```

---

## 6. Sequence Diagram – Timetable Generation (Genetic Algorithm)

```plantuml
@startuml Seq_Generation
skinparam defaultFontName Helvetica
title Timetable Generation – Genetic Algorithm Sequence

actor "Admin/DEO" as Admin
participant "Next.js\nFrontend" as FE
participant "FastAPI\n/generator" as GenEP
participant "BackgroundTasks\n(FastAPI)" as BG
participant "TimetableGenerator\n(GA Engine)" as GA
database "MongoDB" as DB

Admin -> FE : Click Generate Timetable\n(program, batch, semester)
FE -> GenEP : POST /api/v1/generator/generate\n/{program_id}/{batch_id}?semester_id=...
GenEP -> GenEP : Verify admin/deo token
GenEP -> BG : add_task(run_generation_task,\nprogram_id, batch_id, semester_id)
GenEP --> FE : 202 Accepted\n{ message: "Generation started" }
FE --> Admin : Show "Generation in progress" toast

note over BG,GA : Async Background Execution

BG -> DB : Course.find(program_id)
DB --> BG : List[Course]
BG -> DB : Faculty.find_all()
DB --> BG : List[Faculty]
BG -> DB : Room.find_all()
DB --> BG : List[Room]
BG -> DB : Batch.get(batch_id)
DB --> BG : Batch

BG -> GA : TimetableGenerator(courses, faculty,\nrooms, batches)
GA -> GA : _build_session_list()\nExpand courses × sections\n× lecture/tutorial/practical slots

loop 500 Generations
  GA -> GA : initialize_population() [pop=150]\nSmart slot assignment
  GA -> GA : evaluate_fitness()\nCount hard/soft conflicts
  GA -> GA : tournament_selection()\nsize=5
  GA -> GA : crossover()\nTwo-point gene swap
  GA -> GA : mutate()\nRandom re-slot (rate=0.35)
  GA -> GA : Keep elite_size=6 best
end

GA --> BG : best_chromosome (Chromosome)
BG -> BG : Map genes → TimetableEntry\n(resolve names)
BG -> DB : Timetable.insert()\n{ program, batch, semester,\nentries[], is_draft=false }
DB --> BG : Saved Timetable

note over FE : User can manually\nrefresh/poll timetables list

@enduml
```

---

## 7. Sequence Diagram – AI Chat

```plantuml
@startuml Seq_AI_Chat
skinparam defaultFontName Helvetica
title AI Chat – Sequence Diagram

actor "User" as User
participant "AIChatbot\n(React Component)" as Chatbot
participant "Axios\nAPI Client" as Axios
participant "FastAPI\n/api/v1/ai/chat" as AIEP
database "MongoDB" as DB
participant "Groq Cloud API\n(llama-3.3-70b)" as Groq

User -> Chatbot : Type message & press Enter
Chatbot -> Chatbot : Add user message to chat
Chatbot -> Axios : aiChat(message, timetable_id?)
Axios -> AIEP : POST /api/v1/ai/chat\n{ message, timetable_id? }
AIEP -> AIEP : Verify JWT token

AIEP -> DB : Fetch context data:\nFaculty, Courses, Rooms,\nPrograms, Timetable (if id given)
DB --> AIEP : Context documents

AIEP -> AIEP : Build system_prompt\nwith full context JSON

AIEP -> Groq : POST /openai/v1/chat/completions\n{ model, system_prompt, user_message,\ntemperature=0.3, max_tokens=1024 }
Groq --> AIEP : { choices[0].message.content }

AIEP --> Axios : 200 { reply: "..." }
Axios --> Chatbot : ChatResponse
Chatbot -> Chatbot : Append assistant message\n(render markdown)
Chatbot --> User : Display AI reply

@enduml
```

---

## 8. Sequence Diagram – Export Timetable

```plantuml
@startuml Seq_Export
skinparam defaultFontName Helvetica
title Export Timetable – PDF / Excel Sequence

actor "Admin/DEO" as Admin
participant "Frontend" as FE
participant "FastAPI\n/timetables" as TT
participant "ExportService" as Export
database "MongoDB" as DB

Admin -> FE : Click Export (PDF or Excel)
FE -> TT : GET /api/v1/timetables/{id}/export?format=pdf

TT -> DB : Timetable.get(id)
DB --> TT : Timetable document

alt Export PDF
  TT -> Export : ExportService.to_pdf(timetable)
  Export -> Export : Build ReportLab table\nwith Day/Period/Course/Faculty/Room
  Export --> TT : BytesIO (PDF buffer)
  TT --> FE : StreamingResponse\nContent-Type: application/pdf
else Export Excel
  TT -> Export : ExportService.to_excel(timetable)
  Export -> Export : Build pandas DataFrame\nRaw Data + Grid View sheets
  Export --> TT : BytesIO (XLSX buffer)
  TT --> FE : StreamingResponse\nContent-Type: application/vnd.openxmlformats
end

FE --> Admin : Download file

@enduml
```

---

## 9. Component Diagram – Backend

```plantuml
@startuml Component_Backend
skinparam defaultFontName Helvetica
skinparam componentStyle rectangle
title Backend – Component Diagram

package "FastAPI Application" {

  component "main.py" as Main {
    portin " " as P_Main
  }

  package "Core" {
    component "config.py\nSettings + .env" as Config
    component "security.py\nJWT + bcrypt" as Security
    component "init_db.py\nBeanie ODM Init" as InitDB
  }

  package "API Layer" {
    component "deps.py\nOAuth2 Guards\n(get_current_user,\nget_current_admin)" as Deps
    
    package "v1 Endpoints" {
      component "login.py" as Login
      component "users.py" as UsersEP
      component "user_management.py" as UserMgmt
      component "programs.py" as ProgEP
      component "courses.py" as CourseEP
      component "faculty.py" as FacEP
      component "infrastructure.py" as InfraEP
      component "timetables.py" as TT_EP
      component "generator.py" as GenEP
      component "ai.py" as AI_EP
    }
  }

  package "Services" {
    component "TimetableGenerator\n- Genetic Algorithm\n- Gene / Chromosome\n- Population Init\n- Fitness Evaluation\n- Selection/Crossover\n- Mutation" as GA
    component "ExportService\n- to_pdf()\n- to_excel()" as Export
  }

  package "Models (Beanie Documents)" {
    component "User" as MU
    component "Program / Batch\n/ Semester / Section" as MP
    component "Course" as MC
    component "Faculty" as MF
    component "Room" as MR
    component "Timetable\n/ ScheduleConfig" as MT
    component "Student" as MS
  }
}

database "MongoDB" as DB
cloud "Groq API" as Groq

Main --> Config
Main --> InitDB
InitDB --> DB
Login --> Security
Login --> MU
Deps --> Security
Deps --> MU
ProgEP --> MP
CourseEP --> MC
FacEP --> MF
InfraEP --> MR
TT_EP --> MT
TT_EP --> Export
GenEP --> GA
GA --> MC
GA --> MF
GA --> MR
GA --> MP
AI_EP --> Groq
AI_EP --> MT

@enduml
```

---

## 10. Component Diagram – Frontend

```plantuml
@startuml Component_Frontend
skinparam defaultFontName Helvetica
skinparam componentStyle rectangle
title Frontend – Component Diagram (Next.js)

package "Next.js App Router" {

  package "Layout & Providers" {
    component "layout.tsx\n(Root Layout)" as RootLayout
    component "providers.tsx\n(QueryClientProvider)" as Providers
    component "AuthContext.tsx\n(React Context)" as AuthCtx
    component "Sidebar.tsx" as Sidebar
    component "(dashboard)/layout.tsx" as DashLayout
  }

  package "Auth Pages" {
    component "login/page.tsx" as LoginPage
    component "signup/page.tsx" as SignupPage
  }

  package "Admin Pages" {
    component "admin/page.tsx\n(Dashboard Overview)" as AdminHome
    component "admin/courses/page.tsx" as AdminCourses
    component "admin/faculty/page.tsx" as AdminFaculty
    component "admin/programs/page.tsx" as AdminPrograms
    component "admin/rooms/page.tsx" as AdminRooms
    component "admin/generate/page.tsx" as AdminGenerate
    component "admin/timetables/page.tsx" as AdminTimetables
    component "admin/schedule/page.tsx" as AdminSchedule
    component "admin/users/page.tsx" as AdminUsers
  }

  package "DEO Pages" {
    component "deo/page.tsx" as DeoHome
    component "deo/courses, faculty,\nprograms, rooms,\ngenerate, timetables,\nschedule" as DeoPages
  }

  package "Faculty Pages" {
    component "faculty/page.tsx" as FacultyHome
    component "faculty/timetable/page.tsx" as FacultyTT
  }

  package "Student Pages" {
    component "student/page.tsx" as StudentHome
    component "student/timetable/page.tsx" as StudentTT
  }

  package "Shared Components" {
    component "TimetableGrid.tsx" as TTGrid
    component "TimetableListView.tsx" as TTList
    component "AIChatbot.tsx\n(IntelliScheduler AI)" as AIChat
    package "UI Primitives" {
      component "button, card, dialog,\ninput, label, select,\ntabs, textarea,\nbadge, toast" as UILib
    }
  }

  package "Library" {
    component "api.ts\n(Axios Client +\nAll API calls)" as ApiLib
    component "utils.ts\n(cn() etc.)" as Utils
  }
}

RootLayout --> Providers
Providers --> AuthCtx
DashLayout --> Sidebar
DashLayout --> AIChat
AdminHome --> TTGrid
AdminTimetables --> TTGrid
AdminTimetables --> TTList
FacultyTT --> TTGrid
StudentTT --> TTGrid

LoginPage --> ApiLib
SignupPage --> ApiLib
AdminCourses --> ApiLib
AdminFaculty --> ApiLib
AdminPrograms --> ApiLib
AdminRooms --> ApiLib
AdminGenerate --> ApiLib
AdminTimetables --> ApiLib
AdminUsers --> ApiLib
AIChat --> ApiLib

@enduml
```

---

## 11. Activity Diagram – Genetic Algorithm (Timetable Generation)

```plantuml
@startuml Activity_GA
skinparam defaultFontName Helvetica
title Genetic Algorithm – Activity Diagram

start

:Receive: courses, faculty, rooms, batches;
:Build session list\n(course × section × lecture/tutorial/practical);
:Pre-compute faculty busy slots map;
:Separate lab rooms vs lecture rooms;

:Initialize Population (size=150)\nSmart slot-aware random placement;

fork
  :Assign sessions to\nnon-conflicting slots;
fork again
  :Pick qualified faculty\nper course (can_teach);
end fork

repeat
  :Evaluate Fitness for each Chromosome;
  note right: Penalise:\n- Faculty double-booking\n- Room double-booking\n- Batch double-booking\n- Faculty in busy slot\n- Wrong room type (lab vs lecture)\n- Uneven distribution
  :Sort population by fitness (desc);
  :Preserve elite_size=6 chromosomes;
  
  fork
    :Tournament Selection\n(tournament_size=5);
  fork again
    :Two-point Crossover\n(swap gene segments);
  end fork
  
  :Mutation (rate=0.35)\nRandomly re-assign slot/faculty/room\nfor random genes;
  :Form new population;
repeat while (generation < 500 AND best fitness < threshold) is (continue)
-> done;

:Select best Chromosome;
:Map genes → TimetableEntry\n(resolve course/faculty/room names);
:Save Timetable to MongoDB\n(is_draft = false);

stop

@enduml
```

---

## 12. State Diagram – Timetable Lifecycle

```plantuml
@startuml State_Timetable
skinparam defaultFontName Helvetica
title Timetable – State Diagram

[*] --> Pending : Admin triggers generation

state Pending {
  : Awaiting background task
}

Pending --> Generating : Background task starts\n(GA engine runs)

state Generating {
  : Running 500 generations
  : Evaluating fitness
}

Generating --> Draft : GA completes\nis_draft = true

state Draft {
  : Entries created\nEditable by Admin/DEO
}

Draft --> Draft : Admin edits\nentries manually

Draft --> Published : Admin publishes\n(is_draft = false)

state Published {
  : Visible to Faculty & Students
}

Published --> Draft : Reverted for changes

Published --> Exported : Export triggered

state Exported {
  : PDF / Excel downloaded
}

Exported --> Published : Still accessible

Draft --> [*] : Deleted

Published --> [*] : Deleted

@enduml
```

---

## 13. Sequence Diagram – Dependency Injection & Auth Guard

```plantuml
@startuml Seq_DependencyInjection
skinparam defaultFontName Helvetica
title FastAPI Dependency Injection – Auth Guard Flow

participant "HTTP Request\n(with Bearer token)" as Req
participant "OAuth2PasswordBearer\n(reusable_oauth2)" as OAuth
participant "get_current_user()\n[deps.py]" as GCU
participant "jose.jwt.decode()" as JWT
participant "MongoDB\nusers" as DB
participant "get_current_active_user()" as GCAU
participant "get_current_admin_user()" as GCAD
participant "Protected Endpoint" as EP

Req -> OAuth : Extract Bearer token\nfrom Authorization header
OAuth -> GCU : token string
GCU -> JWT : jwt.decode(token, SECRET_KEY, HS256)
alt JWT invalid / expired
  JWT --> GCU : JWTError
  GCU --> Req : 403 Could not validate credentials
else JWT valid
  JWT --> GCU : { sub: user_id, role }
  GCU -> DB : User.get(user_id)
  alt User not found
    DB --> GCU : None
    GCU --> Req : 404 User not found
  else User found
    DB --> GCU : User
    GCU -> GCAU : User
    alt is_active = False
      GCAU --> Req : 400 Inactive user
    else Active
      GCAU -> GCAD : User (for admin routes)
      alt role not in [admin, deo]
        GCAD --> Req : 400 Not enough privileges
      else Authorized
        GCAD -> EP : current_user: User
        EP --> Req : 200 Response
      end
    end
  end
end

@enduml
```

---

## 14. Deployment Diagram

```plantuml
@startuml Deployment_Diagram
skinparam defaultFontName Helvetica
skinparam nodeStyle rectangle
title IntelliScheduler – Deployment Diagram

node "Developer / Production\nMachine (Windows/Linux)" as Dev {

  node "Node.js Runtime\n(v18+)" as NodeRT {
    artifact "Next.js Frontend\n(npm run dev | build)\nPort: 3000" as FEApp
  }

  node "Python 3.11 venv" as PythonRT {
    artifact "FastAPI + Uvicorn\n(uvicorn main:app)\nPort: 8000" as BEApp
    artifact ".env file\n(SECRET_KEY, MONGODB_URI,\nGROQ_API_KEY)" as EnvFile
  }
}

node "MongoDB Server\n(Local or Atlas Cloud)" as MongoNode {
  database "timetable_db" as MongoDB {
    collections "users, programs, batches,\nsemesters, sections,\ncourses, faculty, rooms,\ntimetables, schedule_configs,\nstudents" as Collections
  }
}

cloud "Groq Cloud\napi.groq.com" as GroqCloud {
  artifact "llama-3.3-70b-versatile\nLLM API" as GroqModel
}

node "Client Browser" as Browser {
  artifact "React SPA\n(Next.js SSR/CSR)" as BrowserApp
}

Browser --> FEApp : HTTPS :3000
FEApp --> BEApp : REST API :8000\n(CORS allowed)
BEApp --> MongoDB : MongoDB Wire Protocol\n(27017 or Atlas URI)
BEApp --> GroqCloud : HTTPS API calls\n(Bearer GROQ_API_KEY)
BEApp ..> EnvFile : reads at startup

@enduml
```

---

## 15. Package / Module Dependency Diagram

```plantuml
@startuml Package_Dependency
skinparam defaultFontName Helvetica
title Backend – Package / Module Dependencies

package "main.py" as MAIN
package "app.core" as CORE {
  class config
  class security
}
package "app.db" as DBPKG {
  class init_db
}
package "app.models" as MODELS {
  class users
  class programs
  class courses
  class faculty
  class infrastructure
  class timetable
  class student
}
package "app.schemas" as SCHEMAS {
  class "user\ncourses\nfaculty\nprograms\ninfrastructure\ntimetable\nstudent" as schemas_all
}
package "app.api" as API {
  package "app.api.v1.endpoints" as ENDPOINTS {
    class login
    class users
    class programs
    class courses
    class faculty
    class infrastructure
    class timetables
    class generator
    class ai
    class user_management
  }
  class deps
}
package "app.services" as SERVICES {
  class "generator\n(TimetableGenerator)" as gen_svc
  class "export\n(ExportService)" as exp_svc
}

MAIN --> CORE
MAIN --> DBPKG
MAIN --> API
DBPKG --> MODELS
ENDPOINTS --> MODELS
ENDPOINTS --> SCHEMAS
ENDPOINTS --> CORE
ENDPOINTS --> deps
deps --> CORE
deps --> MODELS
ENDPOINTS ..> SERVICES : uses
SERVICES --> MODELS
gen_svc --> MODELS
exp_svc --> MODELS

@enduml
```

---

## Summary of All Diagrams

| # | Diagram | Type | Purpose |
|---|---------|------|---------|
| 1 | System Architecture | Architecture/C4 | Complete system overview |
| 2 | Domain Class Diagram | UML Class | All models + relationships |
| 3 | Entity Relationship Diagram | ERD | MongoDB collections schema |
| 4 | Use Case Diagram | UML Use Case | Actors & system features |
| 5 | Login Sequence | UML Sequence | JWT auth flow |
| 6 | Generation Sequence | UML Sequence | GA timetable generation |
| 7 | AI Chat Sequence | UML Sequence | Groq LLM chat flow |
| 8 | Export Sequence | UML Sequence | PDF/Excel export flow |
| 9 | Backend Component | UML Component | FastAPI layers |
| 10 | Frontend Component | UML Component | Next.js app structure |
| 11 | GA Activity | UML Activity | GA algorithm steps |
| 12 | Timetable State | UML State | Timetable lifecycle |
| 13 | Auth Guard Sequence | UML Sequence | Dependency injection flow |
| 14 | Deployment Diagram | UML Deployment | Infrastructure layout |
| 15 | Package Dependency | UML Package | Module dependencies |
