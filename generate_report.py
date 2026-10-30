from docx import Document
from docx.shared import Pt
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml.ns import qn

doc = Document()

style = doc.styles['Normal']
font = style.font
font.name = 'Times New Roman'
font.size = Pt(12)
style.element.rPr.rFonts.set(qn('w:eastAsia'), 'Times New Roman')

title = doc.add_paragraph()
title.alignment = WD_ALIGN_PARAGRAPH.CENTER
run = title.add_run('MET CAMPUS APP')
run.bold = True
run.font.name = 'Times New Roman'
run.font.size = Pt(16)

subtitle = doc.add_paragraph()
subtitle.alignment = WD_ALIGN_PARAGRAPH.CENTER
run = subtitle.add_run('MINI PROJECT REPORT')
run.bold = True
run.font.name = 'Times New Roman'
run.font.size = Pt(14)

doc.add_paragraph()
doc.add_paragraph()
doc.add_paragraph()

submitted = doc.add_paragraph()
submitted.alignment = WD_ALIGN_PARAGRAPH.CENTER
run = submitted.add_run('Submitted in partial fulfillment of the requirement for the award of degree of')
run.font.name = 'Times New Roman'
run.font.size = Pt(12)

degree = doc.add_paragraph()
degree.alignment = WD_ALIGN_PARAGRAPH.CENTER
run = degree.add_run('BACHELOR OF ENGINEERING')
run.bold = True
run.font.name = 'Times New Roman'
run.font.size = Pt(12)

in_ = doc.add_paragraph()
in_.alignment = WD_ALIGN_PARAGRAPH.CENTER
run = in_.add_run('IN')
run.font.name = 'Times New Roman'
run.font.size = Pt(12)

branch = doc.add_paragraph()
branch.alignment = WD_ALIGN_PARAGRAPH.CENTER
run = branch.add_run('COMPUTER ENGINEERING')
run.bold = True
run.font.name = 'Times New Roman'
run.font.size = Pt(12)

doc.add_paragraph()
doc.add_paragraph()

by = doc.add_paragraph()
by.alignment = WD_ALIGN_PARAGRAPH.CENTER
run = by.add_run('BY')
run.font.name = 'Times New Roman'
run.font.size = Pt(12)

doc.add_paragraph()
doc.add_paragraph()

guide = doc.add_paragraph()
guide.alignment = WD_ALIGN_PARAGRAPH.CENTER
run = guide.add_run('Under the Guidance of')
run.font.name = 'Times New Roman'
run.font.size = Pt(12)

doc.add_paragraph()
doc.add_paragraph()
doc.add_paragraph()

dept = doc.add_paragraph()
dept.alignment = WD_ALIGN_PARAGRAPH.CENTER
run = dept.add_run('DEPARTMENT OF COMPUTER ENGINEERING')
run.bold = True
run.font.name = 'Times New Roman'
run.font.size = Pt(12)

inst = doc.add_paragraph()
inst.alignment = WD_ALIGN_PARAGRAPH.CENTER
run = inst.add_run('MET INSTITUTE OF TECHNOLOGY')
run.bold = True
run.font.name = 'Times New Roman'
run.font.size = Pt(12)

year = doc.add_paragraph()
year.alignment = WD_ALIGN_PARAGRAPH.CENTER
run = year.add_run('2025-2026')
run.bold = True
run.font.name = 'Times New Roman'
run.font.size = Pt(12)

doc.add_page_break()

toc_heading = doc.add_heading(level=1)
toc_heading.alignment = WD_ALIGN_PARAGRAPH.CENTER
run = toc_heading.add_run('TABLE OF CONTENTS')
run.font.name = 'Times New Roman'
run.font.size = Pt(14)

toc_items = [
    ('Chapter 1: Introduction', '1'),
    ('Chapter 2: Literature Review', '2'),
    ('   2.1 Summary of Literature Review', '2'),
    ('   2.2 Research Gap', '2'),
    ('Chapter 3: Problem Definition and Objectives', '3'),
    ('Chapter 4: Methodology', '4'),
    ('Chapter 5: Results and Discussion', '5'),
    ('Chapter 6: Conclusion', '6'),
    ('References', '7'),
]
for item, page in toc_items:
    p = doc.add_paragraph()
    r1 = p.add_run(item)
    r1.font.name = 'Times New Roman'
    r1.font.size = Pt(12)
    r2 = p.add_run('\t' + page)
    r2.font.name = 'Times New Roman'
    r2.font.size = Pt(12)

doc.add_page_break()

ch1 = doc.add_heading(level=1)
run = ch1.add_run('Chapter 1 - Introduction')
run.font.name = 'Times New Roman'
run.font.size = Pt(14)

p1 = doc.add_paragraph()
run = p1.add_run('1.1 Overview')
run.bold = True
run.font.name = 'Times New Roman'
run.font.size = Pt(12)

p = doc.add_paragraph()
run = p.add_run('In the modern era of digitization, educational institutions are increasingly adopting mobile applications to streamline academic and administrative processes. The MET Campus App is a campus companion application developed for MET Institute of Technology to provide students, faculty, staff and various campus clubs with a unified digital platform for accessing campus-related information and services from a single mobile interface.')
run.font.name = 'Times New Roman'
run.font.size = Pt(12)
p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY

p = doc.add_paragraph()
run = p.add_run('1.2 About MET Campus App')
run.bold = True
run.font.name = 'Times New Roman'
run.font.size = Pt(12)

p = doc.add_paragraph()
run = p.add_run('MET Campus is an Expo-based cross-platform mobile application built using React Native and React Native WebView. The application loads a fully functional web-based campus portal (HTML, CSS and Vanilla JavaScript) inside a native WebView wrapper. It provides role-specific dashboards for different users including Students, Training and Placement Officer (TPO), Heads of Department (HODs), Class Coordinators, Principal and various student clubs like eCell, STAPLE, Code Crafters, TEDxMET Nashik and SACSDE.')
run.font.name = 'Times New Roman'
run.font.size = Pt(12)
p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY

p = doc.add_paragraph()
run = p.add_run('1.3 Need of the Study')
run.bold = True
run.font.name = 'Times New Roman'
run.font.size = Pt(12)

p = doc.add_paragraph()
run = p.add_run('Traditionally, campus information such as timetables, attendance, classroom updates, placement notices and event details are circulated through notice boards, WhatsApp groups or separate portals. This leads to miscommunication, information overload and difficulty in accessing relevant updates. There is a need for a centralized, role-based and user-friendly mobile application to ensure that every user receives only the information relevant to their role.')
run.font.name = 'Times New Roman'
run.font.size = Pt(12)
p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY

p = doc.add_paragraph()
run = p.add_run('1.4 Scope of the Project')
run.bold = True
run.font.name = 'Times New Roman'
run.font.size = Pt(12)

p = doc.add_paragraph()
run = p.add_run('The scope of this project is to design and develop a role-based campus companion application for MET Institute of Technology. The app covers modules such as student home, classroom posts and assignments, announcements, notifications, attendance register, timetable with batch-wise rotations, curriculum view, club events and registrations, TPO placement portal, and staff/club specific dashboards. The application is developed as a prototype with local data storage for demonstration purposes.')
run.font.name = 'Times New Roman'
run.font.size = Pt(12)
p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY

doc.add_page_break()
ch2 = doc.add_heading(level=1)
run = ch2.add_run('Chapter 2 - Literature Review')
run.font.name = 'Times New Roman'
run.font.size = Pt(14)

p = doc.add_paragraph()
run = p.add_run('2.1 Summary of Literature Review')
run.bold = True
run.font.name = 'Times New Roman'
run.font.size = Pt(12)

lit = [
    '1. S. Chand et al., various college ERP systems highlight the need for digitized student services. However, most existing systems are web-only and lack mobile-first, role-specific experiences.',
    '2. React Native documentation emphasizes code reusability across platforms with near-native performance, making it suitable for campus applications.',
    '3. Studies on campus management systems show that integrating attendance, timetable and notifications in one platform improves accessibility and reduces dependency on physical notices.',
    '4. The use of WebView hybrid architecture allows rapid prototyping of complex UI using web technologies while still leveraging native features like hardware back button handling.',
]
for text in lit:
    p = doc.add_paragraph(style='List Bullet')
    run = p.add_run(text)
    run.font.name = 'Times New Roman'
    run.font.size = Pt(12)
    p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY

p = doc.add_paragraph()
run = p.add_run('2.2 Research Gap')
run.bold = True
run.font.name = 'Times New Roman'
run.font.size = Pt(12)

p = doc.add_paragraph()
run = p.add_run('Most existing college applications are either generic ERP portals or single-role apps focusing only on attendance or notices. There is a lack of a unified campus companion that combines student academic modules, placement activities, club management and multiple staff roles in a single mobile application with a consistent, student-friendly interface. The MET Campus App aims to bridge this gap by providing a role-scoped, all-in-one solution tailored specifically for the MET Institute of Technology ecosystem.')
run.font.name = 'Times New Roman'
run.font.size = Pt(12)
p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY

doc.add_page_break()
ch3 = doc.add_heading(level=1)
run = ch3.add_run('Chapter 3 - Problem Definition and Objectives')
run.font.name = 'Times New Roman'
run.font.size = Pt(14)

p = doc.add_paragraph()
run = p.add_run('3.1 Problem Definition')
run.bold = True
run.font.name = 'Times New Roman'
run.font.size = Pt(12)

p = doc.add_paragraph()
run = p.add_run('To design and develop a role-based mobile campus companion application for MET Institute of Technology that integrates academic, placement, co-curricular and administrative information into a single, accessible platform.')
run.font.name = 'Times New Roman'
run.font.size = Pt(12)
p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY

p = doc.add_paragraph()
run = p.add_run('3.2 Objectives')
run.bold = True
run.font.name = 'Times New Roman'
run.font.size = Pt(12)

objs = [
    'To provide a centralized platform for students to access timetable, attendance, classroom posts, assignments and announcements.',
    'To implement role-based access control for TPO, HODs, Class Coordinators, Principal and student clubs.',
    'To develop a digital placement portal for TPO to publish opportunities and manage student applications.',
    'To enable club portals for event promotion, student registration and response tracking.',
    'To provide curriculum details, semester-wise timetable with batch rotations and class-wise roll lists.',
    'To integrate in-app notifications and a user-friendly pastel-themed UI optimized for mobile devices.',
    'To build a cross-platform solution using React Native, Expo and WebView for wider accessibility.',
]
for o in objs:
    p = doc.add_paragraph(style='List Number')
    run = p.add_run(o)
    run.font.name = 'Times New Roman'
    run.font.size = Pt(12)
    p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY

doc.add_page_break()
ch4 = doc.add_heading(level=1)
run = ch4.add_run('Chapter 4 - Methodology')
run.font.name = 'Times New Roman'
run.font.size = Pt(14)

p = doc.add_paragraph()
run = p.add_run('4.1 Technology Stack')
run.bold = True
run.font.name = 'Times New Roman'
run.font.size = Pt(12)

tech = [
    ('Frontend (Native): ', 'React Native 0.86.3, Expo ~57.0.31, React 19.2.3'),
    ('Navigation & UI Components: ', 'React Native Safe Area Context, Expo Status Bar'),
    ('Web Integration: ', 'React Native WebView 13.16.1'),
    ('Web Frontend: ', 'HTML5, CSS3, Vanilla JavaScript'),
    ('Fonts: ', 'Familjen Grotesk'),
    ('Build Tools: ', 'Node.js, custom build.js for bundling web assets into html.js'),
]
for k, v in tech:
    p = doc.add_paragraph()
    run1 = p.add_run(k)
    run1.bold = True
    run1.font.name = 'Times New Roman'
    run1.font.size = Pt(12)
    run2 = p.add_run(v)
    run2.font.name = 'Times New Roman'
    run2.font.size = Pt(12)

p = doc.add_paragraph()
run = p.add_run('4.2 System Architecture')
run.bold = True
run.font.name = 'Times New Roman'
run.font.size = Pt(12)

p = doc.add_paragraph()
run = p.add_run('The MET Campus App follows a hybrid architecture. The native layer (App.js) acts as a wrapper built with React Native and Expo. It renders the entire campus portal using react-native-webview by loading the bundled HTML string from html.js. All UI logic, routing, role-based screens, data handling and interactions are implemented in the web layer (web/*.js). Communication between the web layer and native layer is achieved using window.ReactNativeWebView.postMessage() for passing navigation/state information, and native-side JavaScript injection for handling Android hardware back button functionality.')
run.font.name = 'Times New Roman'
run.font.size = Pt(12)
p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY

p = doc.add_paragraph()
run = p.add_run('4.3 Modules Implemented')
run.bold = True
run.font.name = 'Times New Roman'
run.font.size = Pt(12)

mods = [
    'Authentication Module - Role-based login with demo credentials for Student, TPO, HODs, Class Coordinators, Principal and Clubs.',
    'Student Dashboard - Home screen with quick access to timetable, attendance, classroom, curriculum, clubs and notifications.',
    'Classroom Module - View posts, assignments and announcements posted by faculty/coordinators.',
    'Attendance Module - Explicit attendance register view for students.',
    'Timetable Module - Semester-wise timetable with support for T1-T4 lab/seminar batch rotations.',
    'Curriculum Module - Eight-semester Computer Science & Design (CSD) curriculum display.',
    'Placement Module (TPO) - Create and manage placement opportunities, view and review student applications.',
    'Club Module - Club dashboards for event creation, promotion, registration tracking and responses.',
    'Staff Dashboards - Role-scoped dashboards for HODs, Class Coordinators and Principal.',
    'Notifications - In-app notification center for relevant updates.',
]
for m in mods:
    p = doc.add_paragraph(style='List Bullet')
    run = p.add_run(m)
    run.font.name = 'Times New Roman'
    run.font.size = Pt(12)
    p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY

p = doc.add_paragraph()
run = p.add_run('4.4 Development Methodology')
run.bold = True
run.font.name = 'Times New Roman'
run.font.size = Pt(12)

p = doc.add_paragraph()
run = p.add_run('The project was developed iteratively. First, the web-based campus portal UI was designed and implemented in the web/ directory with separate modules for core logic, screens, data and actions. A custom build script (build.js) was used to bundle all web assets and inline them into html.js. Subsequently, the React Native Expo wrapper (App.js) was configured to load this bundled HTML via WebView with safe area handling, status bar styling and hardware back navigation support. Testing was carried out using Expo Go for both Android and web preview.')
run.font.name = 'Times New Roman'
run.font.size = Pt(12)
p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY

doc.add_page_break()
ch5 = doc.add_heading(level=1)
run = ch5.add_run('Chapter 5 - Results and Discussion')
run.font.name = 'Times New Roman'
run.font.size = Pt(14)

p = doc.add_paragraph()
run = p.add_run('5.1 Results')
run.bold = True
run.font.name = 'Times New Roman'
run.font.size = Pt(12)

res = [
    'Successfully developed a fully functional role-based campus companion mobile application.',
    'Achieved seamless integration of web UI into React Native using WebView with proper native back navigation handling.',
    'Implemented multiple user roles with distinct dashboards and scoped access to features.',
    'Integrated academic modules including timetable, attendance, curriculum, classroom posts and assignments.',
    'Implemented placement and club management modules with local data persistence.',
    'Designed a clean, pastel-themed user interface using Familjen Grotesk for improved readability and modern aesthetics.',
    'Application runs successfully on Expo Go for Android devices and web preview.',
]
for r in res:
    p = doc.add_paragraph(style='List Bullet')
    run = p.add_run(r)
    run.font.name = 'Times New Roman'
    run.font.size = Pt(12)
    p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY

p = doc.add_paragraph()
run = p.add_run('5.2 Discussion')
run.bold = True
run.font.name = 'Times New Roman'
run.font.size = Pt(12)

p = doc.add_paragraph()
run = p.add_run('The MET Campus App demonstrates the effectiveness of a hybrid approach for building campus applications. By combining React Native with a web-based frontend, development time is reduced while maintaining flexibility in UI design. The role-based architecture ensures that each user type sees only relevant information, improving usability. The use of local storage for demo data makes the prototype fully functional without requiring an immediate backend setup. However, for real-world deployment, features like authentication, authorization, data synchronization, push notifications and cloud storage would need to be implemented using a secure backend solution.')
run.font.name = 'Times New Roman'
run.font.size = Pt(12)
p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY

doc.add_page_break()
ch6 = doc.add_heading(level=1)
run = ch6.add_run('Chapter 6 - Conclusion')
run.font.name = 'Times New Roman'
run.font.size = Pt(14)

p = doc.add_paragraph()
run = p.add_run('6.1 Conclusion')
run.bold = True
run.font.name = 'Times New Roman'
run.font.size = Pt(12)

p = doc.add_paragraph()
run = p.add_run('The MET Campus App successfully fulfills the objective of providing a unified, role-based digital platform for the MET Institute of Technology campus community. It integrates essential academic, placement and co-curricular features into a single mobile application, thereby reducing dependency on scattered notice boards and communication groups. The hybrid implementation using React Native, Expo and WebView proved to be an efficient approach for rapid development of a feature-rich prototype.')
run.font.name = 'Times New Roman'
run.font.size = Pt(12)
p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY

p = doc.add_paragraph()
run = p.add_run('6.2 Future Scope')
run.bold = True
run.font.name = 'Times New Roman'
run.font.size = Pt(12)

scope = [
    'Integration with a secure backend using technologies like Node.js/Express with a database such as PostgreSQL or Firebase.',
    'Implementation of real-time authentication and role-based authorization.',
    'Addition of push notifications for assignments, placements and event updates.',
    'Integration of online attendance marking and result publishing modules.',
    'Migration to a fully native implementation or React Native with backend APIs for production use.',
    'Deployment to Google Play Store and Apple App Store after adding proper security measures.',
]
for s in scope:
    p = doc.add_paragraph(style='List Bullet')
    run = p.add_run(s)
    run.font.name = 'Times New Roman'
    run.font.size = Pt(12)
    p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY

doc.add_page_break()
ref = doc.add_heading(level=1)
run = ref.add_run('References')
run.font.name = 'Times New Roman'
run.font.size = Pt(14)

refs = [
    '[1] React Native Documentation, https://reactnative.dev/docs/getting-started',
    '[2] Expo Documentation, https://docs.expo.dev/',
    '[3] React Native WebView, https://github.com/react-native-webview/react-native-webview',
    "[4] Pressman, R.S., Software Engineering: A Practitioner's Approach, McGraw-Hill Education.",
    '[5] Facebook Inc., React Native: Learn once, write anywhere, https://reactnative.dev/',
    '[6] MDN Web Docs - HTML, CSS, JavaScript, https://developer.mozilla.org/',
]
for r in refs:
    p = doc.add_paragraph()
    run = p.add_run(r)
    run.font.name = 'Times New Roman'
    run.font.size = Pt(12)
    p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY

doc.save('MET_Campus_App_Mini_Project_Report.docx')
print('Done')
