
import { Guest, Sponsorship, EventSchedule, PackagePermissions, PackageCategory, PermissionMeta } from './types';

export const MOCK_GUESTS: Guest[] = [
  {
    id: 'G3jp-0001-JP',
    nameOnTag: 'KENJI',
    name: 'Tanaka Kenji',
    gender: 'Male',
    position: 'Delegate',

    country: 'Japan',
    localOrg: 'JCI Osaka',
    senatorshipId: '12345',
    isSenator: true,
    passportId: 'AB1234567',
    package: 'G3jp',
    email: 'tanaka@jci.jp',
    whatsapp: '+81 90-1234-5678',
    lineID: 'kenji_jci',
    phone: '+81 90-1234-5678',
    tShirtSize: 'L',
    foodPreference: 'Vegetarian',
    allergies: 'Peanuts',
    isGolfParticipant: true,
    singleOccupancy: true,
    additionalRoom27Mar: false,
    additionalRoom28Mar: false,
    passportLast4: '1234',
    golfTeeOff: '08:00 AM',
    golfFlightNo: 'A-05',
    golfBuggyNo: 'B-12',
    dinnerTableNo: '05',
    hotelName: 'Shangri-La KL',
    hotelRoomType: 'Single',
    hotelCheckIn: '2026-03-27',
    hotelCheckOut: '2026-04-01',
    checkInCount: 0
  }
];

export const MOCK_SPONSORS: Sponsorship[] = [
  {
    id: 'S1',
    name: 'Petronas',
    tier: 'Diamond',
    logo: 'https://picsum.photos/seed/petronas/200/100',
    website: 'https://petronas.com',
    description: 'Empowering the energy of JCI.'
  }
];

export const MOCK_SCHEDULE: EventSchedule[] = [
  { id: 'E1', date: '27.03.2026', time: 'All Day', title: 'Arrival & Registration', location: 'Hotel Lobby', description: 'Welcoming delegates.', category: 'Social', permissionId: 'Social' },
  { id: 'E2', date: '27.03.2026', time: 'All Day', title: 'JCI Asia-Pacific Academy (full day)', location: 'TBC', description: 'Academy training sessions.', category: 'Conference', permissionId: 'Conference' },
  { id: 'E3', date: '28.03.2026', time: 'All Day', title: 'Arrival & Registration', location: 'Hotel Lobby', description: 'Welcoming delegates.', category: 'Social', permissionId: 'Social' },
  { id: 'E4', date: '28.03.2026', time: 'All Day', title: 'JCI Asia-Pacific Academy (full day)', location: 'TBC', description: 'Academy training sessions.', category: 'Conference', permissionId: 'Conference' },
  { id: 'E5', date: '29.03.2026', time: '07:00 AM', title: 'Breakfast', location: 'Furama Hotel', description: 'Morning gathering.', category: 'Social', permissionId: 'Social' },
  { id: 'E6', date: '29.03.2026', time: '09:00 AM', title: 'National President’s Meeting', location: 'Andaman', description: 'Leadership coordination.', category: 'Conference', permissionId: 'Conference' },
  { id: 'E7', date: '29.03.2026', time: '12:00 PM', title: 'National President’s Luncheon', location: 'Andaman', description: 'Exclusive luncheon for presidents.', category: 'Social', permissionId: 'Social' },
  { id: 'E8', date: '29.03.2026', time: '02:00 PM', title: 'Asia Pacific Development Council Meeting', location: 'Furama Hotel', description: 'Council session.', category: 'Conference', permissionId: 'Conference' },
  { id: 'E9', date: '29.03.2026', time: '03:30 PM', title: 'ASPAC Senate', location: 'Furama Hotel', description: 'Senate session.', category: 'Conference', permissionId: 'Conference' },
  { id: 'E10', date: '29.03.2026', time: '05:00 PM', title: 'Board Meeting', location: 'Andaman', description: 'Strategic board review.', category: 'Conference', permissionId: 'Conference' },
  { id: 'E11', date: '29.03.2026', time: '07:00 PM', title: 'Welcoming Dinner', location: 'Andaman Grand ballroom', description: 'Official opening ceremony.', category: 'Dinner', permissionId: 'Dinner' },
  { id: 'E12', date: '30.03.2026', time: '07:00 AM', title: 'Breakfast', location: 'Furama Hotel', description: 'Start your day right.', category: 'Social', permissionId: 'Social' },
  { id: 'E13', date: '30.03.2026', time: '08:00 AM', title: 'Golf Tournament Day 1', location: 'Templer Park Golf & Country Club', description: 'Competitive round 1.', category: 'Golf', permissionId: 'Golf' },
  { id: 'E14', date: '30.03.2026', time: '09:00 AM', title: 'APDC Training & Forum', location: 'Furama Hotel', description: 'Knowledge sharing session.', category: 'Conference', permissionId: 'Conference' },
  { id: 'E15', date: '30.03.2026', time: '10:00 AM', title: 'Excursion Day 1', location: 'KL City', description: 'Exploring Kuala Lumpur.', category: 'Social', permissionId: 'Social' },
  { id: 'E16', date: '30.03.2026', time: '06:00 PM', title: 'VIP Dinner', location: 'TBC', description: 'Exclusive VIP gathering.', category: 'Dinner', permissionId: 'Dinner' },
  { id: 'E17', date: '30.03.2026', time: '08:00 PM', title: 'JCI in Business', location: 'Andaman Grand ballroom', description: 'Business networking night.', category: 'Conference', permissionId: 'Conference' },
  { id: 'E18', date: '31.03.2026', time: '07:00 AM', title: 'Breakfast', location: 'Furama Hotel', description: 'Final day breakfast.', category: 'Social', permissionId: 'Social' },
  { id: 'E19', date: '31.03.2026', time: '08:00 AM', title: 'Golf Tournament Day 2', location: 'Kota Permai Golf Club', description: 'Final competition round.', category: 'Golf', permissionId: 'Golf' },
  { id: 'E20', date: '31.03.2026', time: '10:00 AM', title: 'Excursion Day 2', location: 'KL Environs', description: 'Regional exploration.', category: 'Social', permissionId: 'Social' },
  { id: 'E21', date: '31.03.2026', time: '07:00 PM', title: 'Farewell & Awards Night', location: 'Andaman Grand ballroom', description: 'Closing ceremony and awards.', category: 'Dinner', permissionId: 'Dinner' }
];

export const DEFAULT_CATEGORY_PERMISSIONS: Record<PackageCategory, PermissionMeta[]> = {
  'APDC': [
    { id: 'apdc_mar28_hotel', name: 'Hotel', date: '28 Mar 2026' },
    { id: 'apdc_mar29_full', name: 'Breakfast, All Meeting, Lunch, Welcome Dinner, Hotel', date: '29 Mar 2026' },
    { id: 'apdc_mar30_full', name: 'Breakfast, Lunch, APDC Training, Hotel', date: '30 Mar 2026' },
    { id: 'apdc_mar31_full', name: 'Breakfast, Excursion, GALA Dinner, Hotel', date: '31 Mar 2026' },
    { id: 'apdc_apr01_brk', name: 'Breakfast', date: '01 Apr 2026' },
  ],
  'JCIM': [
    { id: 'my_day1_golf', name: 'Day 1 Golf', date: '30 Mar 2026', golfType: 'Day1' },
    { id: 'my_day2_golf', name: 'Day 2 Golf', date: '31 Mar 2026', golfType: 'Day2' },
    { id: 'my_welcome', name: 'Welcoming Night', date: '29 Mar 2026' },
    { id: 'my_gala', name: 'GALA Night', date: '31 Mar 2026' },
    { id: 'my_day1_meet', name: 'Day 1 Meeting', date: '29 Mar 2026' },
  ],
  'Int': [
    { id: 'int_day1_golf', name: 'Day 1 Golf', date: '30 Mar 2026', golfType: 'Day1' },
    { id: 'int_day2_golf', name: 'Day 2 Golf', date: '31 Mar 2026', golfType: 'Day2' },
    { id: 'int_day1_hotel', name: 'Day 1 Hotel', date: '27 Mar 2026' },
    { id: 'int_day2_hotel', name: 'Day 2 Hotel', date: '28 Mar 2026' },
    { id: 'int_day3_hotel', name: 'Day 3 Hotel', date: '29 Mar 2026' },
    { id: 'int_pass_29', name: 'All Access Day Pass (Welcome Night)', date: '29 Mar 2026' },
    { id: 'int_pass_30', name: 'All Access Day Pass', date: '30 Mar 2026' },
    { id: 'int_pass_31', name: 'All Access Day Pass (Farewell Night)', date: '31 Mar 2026' },
    { id: 'int_pass_multi', name: 'All Access Day Pass (Mar 29-31)', date: '29-31 Mar 2026' },
  ],
  'JP': [],
  'KR': [],
  'VIP': []
};

const createPerms = (cat: PackageCategory) => {
  const permissions: Record<string, boolean> = {};
  (DEFAULT_CATEGORY_PERMISSIONS[cat] || []).forEach(p => {
    permissions[p.id] = true;
  });
  return { category: cat, permissions };
};

export const DEFAULT_PACKAGE_PERMISSIONS: PackagePermissions = {
  // Int
  'G3': createPerms('Int'),
  'G2': createPerms('Int'),
  'N3': createPerms('Int'),
  'N2': createPerms('Int'),
  'N1': createPerms('Int'),
  'D11': createPerms('Int'),
  'D12': createPerms('Int'),
  'D13': createPerms('Int'),
  'D3A': createPerms('Int'),

  // APDC
  'APDC Option 1': createPerms('APDC'),
  'APDC Option 2': createPerms('APDC'),

  // JCIM
  'Day 1 Meeting Access': createPerms('JCIM'),
  'Welcome Dinner': createPerms('JCIM'),
  'GALA Dinner': createPerms('JCIM'),
  '3 in 1 Events Pass': createPerms('JCIM'),
  '2 in 1 Event Pass A': createPerms('JCIM'),
  '2 in 1 Event Pass B': createPerms('JCIM'),
  '2 in 1 Event Pass C': createPerms('JCIM'),
  '1st & 2nd Golfer': createPerms('JCIM'),
  '2nd Day Golfer': createPerms('JCIM'),

  // JP
  'G3jp': createPerms('JP'),

  // KR
  'G3a': createPerms('KR'),
  'G3b': createPerms('KR'),
};
