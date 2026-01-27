## FASS Test Credentials and Passwords

**IMPORTANT:** All test accounts use standardized passwords. You can update passwords in Supabase Dashboard → Authentication → Users

---

## ADMIN ACCOUNTS
### Admin 1
- **Email:** admin@totalenergies.et
- **Name:** Abebe Kebede
- **Password:** Admin@123456!
- **2FA Enabled:** Yes (test with: 000000)
- **Role:** ADMIN

### Admin 2 (Senior)
- **Email:** senior.admin@totalenergies.et
- **Name:** Sara Tesfaye
- **Password:** SeniorAdmin@123456!
- **2FA Enabled:** Yes (test with: 000000)
- **Role:** ADMIN

---

## MANAGER ACCOUNTS (Station Managers)
### Manager 1 - Bole Station
- **Email:** manager.bole@totalenergies.et
- **Name:** Dawit Haile
- **Password:** Manager@123456!
- **Station:** TotalEnergies Bole
- **2FA Enabled:** Yes (test with: 000000)
- **Role:** MANAGER

### Manager 2 - Mexico Station
- **Email:** manager.mexico@totalenergies.et
- **Name:** Hiwot Girma
- **Password:** Manager@Mexico123!
- **Station:** TotalEnergies Mexico
- **Role:** MANAGER

### Manager 3 - Piassa Station
- **Email:** manager.piassa@totalenergies.et
- **Name:** Yohannes Bekele
- **Password:** Manager@Piassa123!
- **Station:** TotalEnergies Piassa
- **Role:** MANAGER

---

## LOGISTICS ACCOUNTS
### Logistics Lead
- **Email:** logistics.lead@totalenergies.et
- **Name:** Mekonnen Tadesse
- **Password:** Logistics@Lead123!
- **Role:** LOGISTICS

### Fleet Coordinator
- **Email:** fleet@totalenergies.et
- **Name:** Tigist Mengistu
- **Password:** Fleet@123456!
- **Role:** LOGISTICS

### Dispatch Coordinator
- **Email:** dispatch@totalenergies.et
- **Name:** Mulugeta Assefa
- **Password:** Dispatch@123456!
- **Role:** LOGISTICS

---

## DRIVER ACCOUNTS (Tanker Drivers)
### Driver 1 - Senior
- **Email:** driver.1@totalenergies.et
- **Name:** Tesfaye Alemayehu
- **Password:** Driver@123456!
- **Tanker:** AA-12345 (25,000L)
- **Trust Score:** 90/100
- **Role:** DRIVER

### Driver 2
- **Email:** driver.2@totalenergies.et
- **Name:** Getachew Woldemariam
- **Password:** Driver2@123456!
- **Tanker:** AA-23456 (20,000L)
- **Trust Score:** 85/100
- **Role:** DRIVER

### Driver 3
- **Email:** driver.3@totalenergies.et
- **Name:** Solomon Gebre
- **Password:** Driver3@123456!
- **Tanker:** AA-34567 (30,000L)
- **Trust Score:** 80/100
- **Role:** DRIVER

### Driver 4
- **Email:** driver.4@totalenergies.et
- **Name:** Biniam Habtamu
- **Password:** Driver4@123456!
- **Tanker:** AA-45678 (25,000L)
- **Trust Score:** 78/100
- **Role:** DRIVER

### Driver 5
- **Email:** driver.5@totalenergies.et
- **Name:** Hailu Desta
- **Password:** Driver5@123456!
- **Tanker:** AA-56789 (20,000L)
- **Trust Score:** 75/100
- **Role:** DRIVER

---

## STAFF ACCOUNTS (Station Staff)
### Staff 1 - Bole
- **Email:** staff.bole.1@totalenergies.et
- **Name:** Kidist Ayele
- **Password:** Staff@Bole1!
- **Station:** TotalEnergies Bole
- **Role:** STAFF

### Staff 2 - Bole
- **Email:** staff.bole.2@totalenergies.et
- **Name:** Fitsum Negash
- **Password:** Staff@Bole2!
- **Station:** TotalEnergies Bole
- **Role:** STAFF

### Staff 3 - Mexico
- **Email:** staff.mexico@totalenergies.et
- **Name:** Bethlehem Yosef
- **Password:** Staff@Mexico123!
- **Station:** TotalEnergies Mexico
- **Role:** STAFF

### Staff 4 - Piassa
- **Email:** staff.piassa@totalenergies.et
- **Name:** Meseret Fikre
- **Password:** Staff@Piassa123!
- **Station:** TotalEnergies Piassa
- **Role:** STAFF

### Staff 5 - CMC
- **Email:** staff.cmc@totalenergies.et
- **Name:** Henok Tadesse
- **Password:** Staff@CMC123!
- **Station:** TotalEnergies CMC
- **Role:** STAFF

### Staff 6 - Megenagna
- **Email:** staff.megenagna@totalenergies.et
- **Name:** Rahel Bekele
- **Password:** Staff@Megenagna123!
- **Station:** TotalEnergies Megenagna
- **Role:** STAFF

---

## IT SUPPORT ACCOUNTS
### IT Support Lead
- **Email:** it.support@totalenergies.et
- **Name:** Daniel Amanuel
- **Password:** ITSupport@Lead123!
- **Role:** IT_SUPPORT

### IT Support Technician
- **Email:** it.technician@totalenergies.et
- **Name:** Natnael Berhane
- **Password:** ITSupport@Tech123!
- **Role:** IT_SUPPORT

---

## PUBLIC USER ACCOUNTS (Regular Users)
### Public User 1
- **Email:** user.1@example.com
- **Name:** Meron Alemu
- **Password:** User@123456!
- **Role:** PUBLIC
- **Trust Score:** 55/100

### Public User 2
- **Email:** user.2@example.com
- **Name:** Elias Wondimu
- **Password:** User2@123456!
- **Role:** PUBLIC
- **Trust Score:** 60/100

### Public User 3
- **Email:** user.3@example.com
- **Name:** Selamawit Desta
- **Password:** User3@123456!
- **Role:** PUBLIC
- **Trust Score:** 45/100

### Public User 4
- **Email:** user.4@example.com
- **Name:** Fasil Mesfin
- **Password:** User4@123456!
- **Role:** PUBLIC
- **Trust Score:** 52/100

### Public User 5
- **Email:** user.5@example.com
- **Name:** Tsega Hailu
- **Password:** User5@123456!
- **Role:** PUBLIC
- **Trust Score:** 58/100

---

## QUICK TEST SCENARIOS

### Scenario 1: Admin with 2FA
1. Login: `admin@totalenergies.et` / `Admin@123456!`
2. When prompted for 2FA code, enter: `000000`
3. Access: Admin Dashboard → All system functions

### Scenario 2: Station Manager
1. Login: `manager.bole@totalenergies.et` / `Manager@123456!`
2. Access: Manager Dashboard → Manage Bole Station
3. View: Fuel inventory, Staff, Reports

### Scenario 3: Tanker Driver
1. Login: `driver.1@totalenergies.et` / `Driver@123456!`
2. Access: Driver Dashboard
3. View: Active trips, delivery status, GPS tracking

### Scenario 4: Station Staff
1. Login: `staff.bole.1@totalenergies.et` / `Staff@Bole1!`
2. Access: Staff Dashboard → Fuel status updates
3. Submit fuel status reports

### Scenario 5: Public User
1. Login: `user.1@example.com` / `User@123456!`
2. Access: Public Dashboard
3. View: Station locations, fuel availability, submit fuel reports

### Scenario 6: Logistics Coordinator
1. Login: `logistics.lead@totalenergies.et` / `Logistics@Lead123!`
2. Access: Logistics Dashboard
3. View: Fleet status, delivery routes, tanker tracking

### Scenario 7: IT Support
1. Login: `it.support@totalenergies.et` / `ITSupport@Lead123!`
2. Access: IT Support Dashboard
3. View: System logs, health checks

---

## NOTES FOR TESTING

1. **Language Support:** All users support both Amharic (am) and English (en)
   - Switch language with the Language Switcher in header

2. **2FA Testing:**
   - Admin accounts have 2FA enabled
   - Test code: `000000` (for demo purposes)
   - In production, use actual authenticator apps

3. **Station Subscriptions:**
   - Public users have pre-configured subscriptions to get notifications
   - Test notifications when fuel status changes

4. **Fuel Types Available:**
   - `diesel` - Standard diesel (72.50 ETB/L)
   - `benzene_95` - Regular petrol (74.80 ETB/L)
   - `benzene_97` - Premium petrol (78.20 ETB/L)

5. **Sample Stations:**
   - TotalEnergies Bole (24 Hours)
   - TotalEnergies Megenagna (6 AM - 11 PM)
   - TotalEnergies Mexico (6 AM - 10 PM)
   - TotalEnergies CMC (6 AM - 10 PM)
   - TotalEnergies Piassa (24 Hours)
   - TotalEnergies Gerji (6 AM - 10 PM)
   - TotalEnergies Kazanchis (6 AM - 11 PM)
   - TotalEnergies Sarbet (6 AM - 10 PM)
   - TotalEnergies Arat Kilo (6 AM - 10 PM)
   - TotalEnergies Ayat (6 AM - 10 PM)

6. **Queue Levels:**
   - `none` - No queue (green)
   - `short` - Less than 5 minutes (blue)
   - `medium` - 5-15 minutes (yellow)
   - `long` - 15-30 minutes (orange)
   - `very_long` - More than 30 minutes (red)

7. **Resetting Passwords:**
   - Go to Supabase Dashboard → Authentication → Users
   - Click user email → "Reset password" in dropdown
   - Send reset link via email
