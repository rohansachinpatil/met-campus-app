/* Official course/roster text supplied for the MET CSD demo. */
const CURRICULUM_DATA = [
  { semester:'I', academicYear:'2024–25', programme:'B.Tech. in Computer Engineering and Allied Programs', courses:[
    ['BSC','24AF1000BS101','Engineering Mathematics - I',3],
    ['BSC','24AF1CHEBS102','Engineering Chemistry',3],
    ['BSC','24AF1CHEBS103L','Engineering Chemistry Lab',1],
    ['ESC','24AF1EMES104','Engineering Mechanics',3],
    ['ESC','24AF1EMES105L','Engineering Mechanics Lab',1],
    ['ESC','24AF1000ES106','Programming for Problem Solving',2],
    ['ESC','24AF1000ES107L','Programming for Problem Solving Lab',1],
    ['VSEC','24AF1000VS108L','Workshop Practices',2],
    ['AEC-01','24AF1000VS109','Communication Skills',2],
    ['AEC-01','24AF1000VS110L','Communication Skills Lab',1],
    ['CC','24AF1000CC111','Yoga Education / NSS-I / NCC',2]
  ]},
  { semester:'II', academicYear:'2024–25', programme:'B.Tech. in Computer Engineering and Allied Programs', courses:[
    ['BSC','24AF1000BS201','Engineering Mathematics - II',3],
    ['BSC','24AF2PHYBS202','Engineering Physics',3],
    ['BSC','24AF2PHYBS203L','Engineering Physics Lab',1],
    ['ESC','24AF2EGRES204','Engineering Graphics',2],
    ['ESC','24AF2EGRES205L','Engineering Graphics Lab',1],
    ['ESC','24AF1000ES206','Basic Electrical and Electronics Engineering',3],
    ['ESC','24AF1000ES207L','Basic Electrical and Electronics Engineering Lab',1],
    ['ESC','24AF2CMEES208','Basic Civil and Mechanical Engineering',3],
    ['BSC','24AF1EEEES209','Energy and Environmental Engineering · Audit','Audit'],
    ['IKS','24AF1000IK210','IKS Bucket',2],
    ['VSEC','24AF1000VS211','Design Thinking',2],
    ['CC','24AF1000CC212','Integrated Personality Development / NSS-II / Health and Wellness',2]
  ]},
  { semester:'III', academicYear:'2025–26', programme:'B.Tech. in Computer Science and Design', courses:[
    ['BSC','25AF2000BS301','Engineering Mathematics-III',3],
    ['PCC1','25AF1257PC302','Fundamentals of Data Structures',3],
    ['PCC2','25AF1245PC303','Discrete Mathematics',3],
    ['PCC3','25AF1257PC304','Computer Graphics',2],
    ['OE','25AF1XXXOEM05X','Any Course from the Open Elective Bucket',2],
    ['MDM','25AF1257MD306','MDM Bucket','—'],
    ['PCC Lab','25AF1257PCL307','Fundamentals of Data Structures Laboratory',1],
    ['VEC','25AF1000VE308A','Life of Chhatrapati Shivaji Maharaj',1],
    ['PCC Lab','25AF1257PCL309','Computer Graphics Laboratory',1],
    ['VSEC','25AF1000VE310','UHV - II',3]
  ]},
  { semester:'IV', academicYear:'2025–26', programme:'B.Tech. in Computer Science and Design', courses:[
    ['PCC1','25AF1245PC401','Design and Analysis of Algorithms',3],
    ['PCC2','25AF1245PC402','Computer Architecture and Organization',3],
    ['PCC3','25AF1245PC403','Probability and Statistics',3],
    ['HSSM','25AF1257AE404','Operating Systems',3],
    ['Open Elective','25AF1XXXOEM05X','Any Course from the Open Elective Bucket',2],
    ['MDM','25AF1257MD406','MDM Bucket','—'],
    ['VSEC','25AF1COIVE407','Constitution of India · Audit','Audit'],
    ['VSEC','25AF1000VE408B','Life of Bharat Ratna Dr. Babasaheb Ambedkar',1],
    ['PCC Lab','25AF1245PC409','Design and Analysis of Algorithms Laboratory',1],
    ['AEC','25AF1000AE410','Modern Indian Languages · Marathi / Hindi / Sanskrit',2],
    ['PCC Lab','25AF1257PCL411','Object-Oriented Modelling Laboratory',2],
    ['PCC Lab','25AF1257PCL412','Operating Systems Laboratory',1],
    ['VSEC · exit option','25AF1245VE414','Full Stack Development Project',8]
  ]},
  { semester:'V', academicYear:'2026–27', programme:'Third Year · B.Tech. in Computer Science and Design', courses:[
    ['PCC1','26AF1245PC501','Machine Learning',3],
    ['PCC2','26AF1245PC502','Theory of Computations',3],
    ['PCC3','26AF1257PC503','Software Engineering and Project Management',3],
    ['PCC4','26AF1257PC504','Database System Design',3],
    ['Open Elective','25AF1XXXOEM05X','Business Analytics & Text Mining Modeling using Python',2],
    ['MDM','26AF1257MD506','MDM Bucket','—'],
    ['PEC · Elective I','26AF1257PE507','Pattern Recognition / Data Mining and Warehousing / Internet of Things',3],
    ['PCC Lab','26AF1257PCL508','Machine Learning Laboratory',1],
    ['PCC Lab','26AF1257PCL509','Full Stack Development (SE Lab)',2],
    ['PCC Lab','26AF1257PCL509','Database System Design Laboratory',1],
    ['AEC','26AF1257AE510','Seminar',1]
  ]},
  { semester:'VI', academicYear:'2026–27', programme:'Third Year · B.Tech. in Computer Science and Design', courses:[
    ['PCC1','26AF1245PC601','Compiler Design',3],
    ['PCC2','26AF1257PC602','Computer Networks',3],
    ['PCC3','26AF1257PC603','Information Security and Privacy',3],
    ['PEC · Elective II','26AF1257PE604','Game Design and Development / Artificial Intelligence',3],
    ['PEC · Elective III','26AF1257PE605','Web Technology and Application Design / UI/UX Design',4],
    ['MDM','26AF1257MD606','MDM Bucket','—'],
    ['PCC Lab','26AF1257PCL607','Compiler Design and Game Design Laboratory',1],
    ['PCC Lab','26AF1257PCL608','UI/UX and Computer Networks Laboratory',1],
    ['VSEC','26AF1257VE609','Mini Project',2],
    ['VSEC · exit option','26AF1257VE610','Data Analysis Project · choose any two exit courses',8]
  ]},
  { semester:'VII', academicYear:'2027–28', programme:'Fourth Year · B.Tech. in Computer Science and Design', courses:[
    ['PCC1','','Artificial Intelligence',3],
    ['PCC2','','Cloud Computing',3],
    ['PEC · Elective IV','','Natural Language Processing / Research Methodology / Software Testing',2],
    ['MDM','','Deep Learning',2],
    ['Internship / OJT','','Project Phase - I',12]
  ]},
  { semester:'VIII', academicYear:'2027–28', programme:'Fourth Year · B.Tech. in Computer Science and Design', courses:[
    ['PCC1','','Software Architecture',3],
    ['PCC2','','Cryptography and Network Security',3],
    ['PEC · Elective V','','Blockchain Technology / Virtual Reality / Social Network Analysis',3],
    ['MDM','','System Administration',2],
    ['Open Elective','','Information Theory & Coding',4],
    ['Entrepreneurship / Economics / Management','','Intellectual Property Rights',2],
    ['VSEC','','Foreign Language Studies',1],
    ['AEC','','Project Phase - II',2]
  ]}
];

const CSD_STUDENT_ROSTER = [
  [1, "2405240000001", "Prachi Mahesh Aher", "prachi", "01", "prachi01"],
  [2, "2405240000002", "Bhargavram Prashant Badhe", "bhargavram", "02", "bhargavram02"],
  [3, "2405240000003", "Vihar Rajeshwar Bhagat", "vihar", "03", "vihar03"],
  [4, "2405240000004", "Ayush Yogesh Bhavsar", "ayush", "04", "ayush04"],
  [5, "2405240000005", "Bhushan Chandar Bhusare", "bhushan", "05", "bhushan05"],
  [6, "2405240000006", "Shruti Satish Boraste", "shruti", "06", "shruti06"],
  [7, "2405240000007", "Charul Divakar Borde", "charul", "07", "charul07"],
  [8, "2405240000008", "Mohit Nitin Borse", "mohit", "08", "mohit08"],
  [9, "2405240000009", "Vivek Anil Borse", "vivek", "09", "vivek09"],
  [10, "2405240000010", "Snehal Somnath Burkul", "snehal", "10", "snehal10"],
  [11, "2405240000011", "Samarth Vishal Chandwade", "samarth", "11", "samarth11"],
  [12, "2405240000012", "Parth Kailas Deore", "parth", "12", "parth12"],
  [13, "2405240000013", "Gayatri Dnyaneshwar Dhatrak", "gayatri", "13", "gayatri13"],
  [14, "2405240000014", "Sankalp Shital Dusane", "sankalp", "14", "sankalp14"],
  [15, "2405240000015", "Agamya Anil Garud", "agamya", "15", "agamya15"],
  [16, "2405240000016", "Priya Datta Holkar", "priya", "16", "priya16"],
  [17, "2405240000017", "Aditi Rajesh Iste", "aditi", "17", "aditi17"],
  [18, "2405240000018", "Riya Rajan Jadhav", "riya", "18", "riya18"],
  [19, "2405240000019", "Shivam Vishnukant Jadhav", "shivam", "19", "shivam19"],
  [20, "2405240000020", "Atharv Sachin Kamble", "atharv", "20", "atharv20"],
  [21, "2405240000021", "Kanchan Kawale", "kanchan", "21", "kanchan21"],
  [22, "2405240000022", "Om Prashant Kekan", "om", "22", "om22"],
  [23, "2405240000023", "Shravani Sunil Khairnar", "shravani", "23", "shravani23"],
  [24, "2405240000024", "Krushna Ravindra Khode", "krushna", "24", "krushna24"],
  [25, "2405240000025", "Om Sunoji Kinge", "om", "25", "om25"],
  [26, "2405240000026", "Devanshi Ajit Kulkarni", "devanshi", "26", "devanshi26"],
  [27, "2405240000027", "Rupesh Devidas Landge", "rupesh", "27", "rupesh27"],
  [28, "2405240000028", "Mahesh Vasudev Mahajan", "mahesh", "28", "mahesh28"],
  [29, "2405240000029", "Gauri Rajendra Mishra", "gauri", "29", "gauri29"],
  [30, "2405240000030", "Krishna Ganesh Nangare", "krishna", "30", "krishna30"],
  [31, "2405240000031", "Pal Abhay Bhamare", "pal", "31", "pal31"],
  [32, "2405240000032", "Amit Santosh Pande", "amit", "32", "amit32"],
  [33, "2405240000033", "Ayush Amod Parab", "ayush", "33", "ayush33"],
  [34, "2405240000034", "Aukshani Nitin Patil", "aukshani", "34", "aukshani34"],
  [35, "2405240000035", "Dinesh Gulab Patil", "dinesh", "35", "dinesh35"],
  [36, "2405240000036", "Om Satish Patil", "om", "36", "om36"],
  [37, "2405240000037", "Prathamesh Pralhad Patil", "prathamesh", "37", "prathamesh37"],
  [38, "2405240000038", "Rohan Sachin Patil", "rohan", "38", "rohan38"],
  [39, "2405240000039", "Tejas Pradip Patil", "tejas", "39", "tejas39"],
  [40, "2405240000040", "Yash Nitin Patil", "yash", "40", "yash40"],
  [41, "2405240000041", "Manish Saidas Pawar", "manish", "41", "manish41"],
  [42, "2405240000042", "Priyanshi Singh", "priyanshi", "42", "priyanshi42"],
  [43, "2405240000043", "Purva Ajit Rane", "purva", "43", "purva43"],
  [44, "2405240000044", "Jasmin Vechya Raut", "jasmin", "44", "jasmin44"],
  [45, "2405240000045", "Aditya Shrikrishna Raysing", "aditya", "45", "aditya45"],
  [46, "2405240000046", "Priyanka Rahul Ripote", "priyanka", "46", "priyanka46"],
  [47, "2405240000047", "Prathamesh Sunil Salunke", "prathamesh", "47", "prathamesh47"],
  [48, "2405240000048", "Saumya Bhandari", "saumya", "48", "saumya48"],
  [49, "2405240000049", "Kunal Sanjay Shinkar", "kunal", "49", "kunal49"],
  [50, "2405240000050", "Shravani Pralhad Narode", "shravani", "50", "shravani50"],
  [51, "2405240000051", "Shubham Kishor Jadhav", "shubham", "51", "shubham51"],
  [52, "2405240000052", "Anjali Santosh Singh", "anjali", "52", "anjali52"],
  [53, "2405240000053", "Harsh Devendra Singh", "harsh", "53", "harsh53"],
  [54, "2405240000054", "Sneha Atul Warpe", "sneha", "54", "sneha54"],
  [55, "2405240000055", "Sneha Praveen Dagwar", "sneha", "55", "sneha55"],
  [56, "2405240000056", "Mitesh Rajendra Tajanpure", "mitesh", "56", "mitesh56"],
  [57, "2405240000057", "Annanya Atishkumar Tayde", "annanya", "57", "annanya57"],
  [58, "2405240000058", "Archita Shankar Tejale", "archita", "58", "archita58"],
  [59, "2405240000059", "Omkar Sujit Thawale", "omkar", "59", "omkar59"],
  [60, "2405240000060", "Aditya Manikrao Waghmode", "aditya", "60", "aditya60"],
  [61, "2405240000061", "Samiksha Nilesh Wani", "samiksha", "61", "samiksha61"],
  [62, "2405240000062", "Anshraj Ramakant Yadav", "anshraj", "62", "anshraj62"],
  [63, "2405240000063", "Arpita Dipak Yeole", "arpita", "63", "arpita63"],
  [64, "2405240000064", "Kiran Ramdas Zodge", "kiran", "64", "kiran64"],
  [65, "2405240000065", "Aadarsh Hiteshbhai Chopada", "aadarsh", "65", "aadarsh65"],
  [66, "2405240000066", "Harshad Arvind Ahire", "harshad", "66", "harshad66"],
  [67, "2405240000067", "Ritesh Aaba Ahire", "ritesh", "67", "ritesh67"],
  [68, "2405240000068", "Tanmay Sachin Avhad", "tanmay", "68", "tanmay68"],
  [69, "2405240000069", "Parshva Ajay Bora", "parshva", "69", "parshva69"],
  [70, "2405240000070", "Tanishka Vijay More", "tanishka", "70", "tanishka70"],
  [71, "2405240000071", "Parth Pitambar Nerkar", "parth", "71", "parth71"],
  [72, "2405240000072", "Bhavy Sunil Patel", "bhavy", "72", "bhavy72"],
  [73, "2405240000073", "Ashwini Arun Tayde", "ashwini", "73", "ashwini73"],
  [74, "2405240000074", "Sanchita Dinkar Thakur", "sanchita", "74", "sanchita74"]
];

/* Verified T.E. CSD Sem V teaching-load timetable for AY 2026–27. */
const TE_CSD_SEM_V_TIMETABLE_META = {
  classScope:'T.E. CSD', semester:'V', academicYear:'2026–27',
  effectiveFrom:'2026-08-01', sourceTitle:'Teaching Load for A.Y. 2026-27 Sem V',
  coverage:'Monday–Friday', verified:true
};
const TE_CSD_SEM_V_BATCHES = [
  {id:'T1',start:1,end:20},
  {id:'T2',start:21,end:40},
  {id:'T3',start:41,end:60},
  {id:'T4',start:61,end:76}
];
function teCourseSlot(start,end,subjectId,type,room,extra){
  return Object.assign({start:start,end:end,subjectId:subjectId,type:type,room:room},extra || {});
}
function teCampusSlot(start,end,title,code,type,room,extra){
  return Object.assign({start:start,end:end,title:title,code:code,type:type,room:room,tone:'peri'},extra || {});
}
const TE_CSD_SEM_V_TIMETABLE = {
  1:[
    teCourseSlot('08:00','09:00','toc','Lecture','614'),
    teCourseSlot('09:00','10:00','fsd','Lecture','614'),
    teCourseSlot('10:00','11:00','oe','Lecture','614'),
    teCourseSlot('11:00','12:00','iot','Lecture','614'),
    teCourseSlot('12:30','14:30','ml_lab','Lab','514',{batch:'T1',displayName:'ML Lab',faculty:'Prof. S. S. Shaikh (S.S.S)'}),
    teCourseSlot('12:30','14:30','fsdl','Lab','515',{batch:'T2',displayName:'Full Stack Development lab',faculty:'Dr. N. J. Rathod (N.J.R)'}),
    teCourseSlot('12:30','14:30','dsd_lab','Lab','513',{batch:'T3',displayName:'DSD lab',faculty:'Prof. K. T. Borse (K.T.B)'}),
    teCourseSlot('12:30','14:30','sem','Seminar','507-B',{batch:'T4',displayName:'Seminar',faculty:'Prof. D. M. Avhad (D.M.A)'}),
    teCourseSlot('14:30','15:30','sem','Seminar','507-B / 513 / 514 / 515',{displayName:'Seminar',faculty:'Prof. D. M. Avhad (D.M.A) / Prof. S. P. Khaimar (S.P.K)'})
  ],
  2:[
    teCourseSlot('08:00','09:00','toc','Lecture','614'),
    teCourseSlot('09:00','10:00','wc','Lecture','614'),
    teCampusSlot('10:00','11:00','NPTEL / Infosys Springboard Lab','NPTEL','Lab','308-A / 507-B',{faculty:''}),
    teCourseSlot('11:00','12:00','oe','Lecture','614'),
    teCourseSlot('12:30','14:30','fsdl','Lab','515',{batch:'T1',displayName:'Full Stack Development lab',faculty:'Dr. N. J. Rathod (N.J.R)'}),
    teCourseSlot('12:30','14:30','dsd_lab','Lab','513',{batch:'T2',displayName:'DSD lab',faculty:'Prof. K. T. Borse (K.T.B)'}),
    teCourseSlot('12:30','14:30','sem','Seminar','507-B',{batch:'T3',displayName:'Seminar',faculty:'Prof. D. M. Avhad (D.M.A)'}),
    teCourseSlot('12:30','14:30','ml_lab','Lab','514',{batch:'T4',displayName:'ML Lab',faculty:'Prof. S. S. Shaikh (S.S.S)'}),
    teCourseSlot('14:30','15:30','dsd','Lecture','614')
  ],
  3:[
    teCourseSlot('08:00','09:00','toc','Lecture','614'),
    teCourseSlot('09:00','10:00','ml','Lecture','614'),
    teCourseSlot('10:00','11:00','sep','Lecture','614',{displayCode:'SEPM'}),
    teCourseSlot('11:00','12:00','wc','Lecture','614'),
    teCourseSlot('12:30','14:30','dsd_lab','Lab','513',{batch:'T1',displayName:'DSD lab',faculty:'Prof. D. M. Avhad (D.M.A)'}),
    teCourseSlot('12:30','14:30','sem','Seminar','507-B',{batch:'T2',displayName:'Seminar',faculty:'Prof. S. P. Khaimar (S.P.K)'}),
    teCourseSlot('12:30','14:30','ml_lab','Lab','514',{batch:'T3',displayName:'ML Lab',faculty:'Prof. S. S. Shaikh (S.S.S)'}),
    teCourseSlot('12:30','14:30','fsdl','Lab','515',{batch:'T4',displayName:'Full Stack Development lab',faculty:'Dr. N. J. Rathod (N.J.R)'}),
    teCourseSlot('14:30','15:30','dsd','Lecture','614')
  ],
  4:[
    teCourseSlot('08:00','09:00','toc','Lecture','614'),
    teCourseSlot('09:00','10:00','ml','Lecture','614'),
    teCourseSlot('10:00','11:00','iot','Lecture','614'),
    teCampusSlot('11:00','12:00','Library / Sports','ACT','Activity','',{faculty:''}),
    teCourseSlot('12:30','14:30','sem','Seminar','507-B',{batch:'T1',displayName:'Seminar',faculty:'Prof. S. P. Khaimar (S.P.K)'}),
    teCourseSlot('12:30','14:30','ml_lab','Lab','514',{batch:'T2',displayName:'ML Lab',faculty:'Prof. S. S. Shaikh (S.S.S)'}),
    teCourseSlot('12:30','14:30','fsdl','Lab','515',{batch:'T3',displayName:'Full Stack Development lab',faculty:'Dr. N. J. Rathod (N.J.R)'}),
    teCourseSlot('12:30','14:30','dsd_lab','Lab','513',{batch:'T4',displayName:'DSD lab',faculty:'Prof. D. M. Avhad (D.M.A)'}),
    teCourseSlot('14:30','15:30','sem','Seminar','507-B / 513 / 308-a',{displayName:'Seminar',faculty:'Prof. D. M. Avhad (D.M.A) / Prof. S. P. Khaimar (S.P.K)'})
  ],
  5:[
    teCourseSlot('08:00','09:00','sep','Lecture','614',{displayCode:'SEPM'}),
    teCourseSlot('09:00','10:00','ml','Lecture','614'),
    teCourseSlot('10:00','11:00','iot','Lecture','614'),
    teCourseSlot('11:00','12:00','dsd','Lecture','614'),
    teCampusSlot('12:30','13:30','NPTEL / Infosys Springboard Lab','NPTEL','Lab','513 / 514 / 515',{faculty:''}),
    teCourseSlot('13:30','14:30','sep','Lecture','614',{displayCode:'SEPM'}),
    teCourseSlot('14:30','15:30','sem','Seminar','507-B / 513 / 514 / 515',{displayName:'Seminar',faculty:'Prof. D. M. Avhad (D.M.A) / Prof. S. P. Khaimar (S.P.K)'})
  ],
  6:[]
};

const CAMPUS_CLUBS = [
  { id:'ecell', name:'eCell MET', subtitle:'Entrepreneurship Cell', tone:'butter' },
  { id:'staple', name:'STAPLE', subtitle:'Training & Placement Cell', tone:'peri' },
  { id:'codecrafters', name:'Code Crafters', subtitle:'Student developer community', tone:'mint' },
  { id:'tedxmet', name:'TEDxMET Nashik', subtitle:'Ideas worth spreading', tone:'rose' },
  { id:'sacsde', name:'SACSDE', subtitle:'Student Committee of CSD', tone:'lilac' }
];

/* Demo-only identities. Replace these placeholders with institution-managed accounts before production. */
const CAMPUS_PORTALS = [
  { id:'tpo', username:'tpo_iot', email:'tpo@met.edu', password:'metcampus', role:'tpo', name:'Training & Placement Officer', firstName:'TPO', label:'TPO · Training & Placement', tone:'mint', department:'Institute' },
  { id:'hod1', username:'hodcsd_iot', email:'hod1@met.edu', password:'metcampus', role:'hod', name:'CSD Head of Department', firstName:'CSD HOD', label:'HOD · Computer Science & Design', tone:'lilac', department:'CSD' },
  { id:'hod2', username:'hodcse_iot', email:'hod2@met.edu', password:'metcampus', role:'hod', name:'Department HOD 2', firstName:'HOD 2', label:'HOD · department not assigned', tone:'peri', department:'' },
  { id:'hod3', username:'hodar_iot', email:'hod3@met.edu', password:'metcampus', role:'hod', name:'Department HOD 3', firstName:'HOD 3', label:'HOD · department not assigned', tone:'peri', department:'' },
  { id:'hod4', username:'hodcee_iot', email:'hod4@met.edu', password:'metcampus', role:'hod', name:'Department HOD 4', firstName:'HOD 4', label:'HOD · department not assigned', tone:'peri', department:'' },
  { id:'hod5', username:'hodece_iot', email:'hod5@met.edu', password:'metcampus', role:'hod', name:'Department HOD 5', firstName:'HOD 5', label:'HOD · department not assigned', tone:'peri', department:'' },
  { id:'cc_fy', username:'ccfe_iot', email:'cc.fy@met.edu', password:'metcampus', role:'coordinator', name:'First Year Class Coordinator', firstName:'First Year', label:'Class coordinator · First year', tone:'butter', classScope:'F.E.' },
  { id:'cc_sy', username:'cccsd_iot', email:'cc.sy@met.edu', password:'metcampus', role:'coordinator', name:'Second Year CSD Coordinator', firstName:'Second Year', label:'Class coordinator · S.E. CSD', tone:'peach', classScope:'S.E. CSD' },
  { id:'cc_ty', username:'cctycsd_iot', email:'cc.ty@met.edu', password:'metcampus', role:'coordinator', name:'Third Year CSD Coordinator', firstName:'Third Year', label:'Class coordinator · T.E. CSD', tone:'lilac', classScope:'T.E. CSD' },
  { id:'cc_by', username:'ccbe_iot', email:'cc.by@met.edu', password:'metcampus', role:'coordinator', name:'Fourth Year Class Coordinator', firstName:'Fourth Year', label:'Class coordinator · Fourth year', tone:'rose', classScope:'B.E.' },
  { id:'principal', username:'principal_iot', email:'principal@met.edu', password:'metcampus', role:'principal', name:'Principal Office', firstName:'Principal', label:'Principal', tone:'ink', department:'Institute' },
  { id:'club_ecell', username:'ecellmet_iot', email:'ecell@met.edu', password:'metcampus', role:'club', clubId:'ecell', name:'eCell MET', firstName:'eCell', label:'Club administrator · eCell MET', tone:'butter' },
  { id:'club_staple', username:'staple_iot', email:'staple@met.edu', password:'metcampus', role:'club', clubId:'staple', name:'STAPLE', firstName:'STAPLE', label:'Club administrator · STAPLE', tone:'peri' },
  { id:'club_codecrafters', username:'codecrafters_iot', email:'codecrafters@met.edu', password:'metcampus', role:'club', clubId:'codecrafters', name:'Code Crafters', firstName:'Code Crafters', label:'Club administrator · Code Crafters', tone:'mint' },
  { id:'club_tedxmet', username:'tedxmet_iot', email:'tedx@met.edu', password:'metcampus', role:'club', clubId:'tedxmet', name:'TEDxMET Nashik', firstName:'TEDxMET', label:'Club administrator · TEDxMET Nashik', tone:'rose' },
  { id:'club_sacsde', username:'sacsde_iot', email:'sacsde@met.edu', password:'metcampus', role:'club', clubId:'sacsde', name:'SACSDE', firstName:'SACSDE', label:'Club administrator · SACSDE', tone:'lilac' }
];
