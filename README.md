# PetHaven – Integrated Pet Welfare and Management System

## Project Overview
PetHaven is a web-based Integrated Pet Welfare and Management System designed to centralize pet-related services such as pet adoption, medical care, lost and found reporting, and verification of animal shelters and veterinarians. The platform brings together multiple stakeholders-pet owners, general users, shelters, veterinarians, and system administrators-into a single, unified system to improve efficiency, transparency, and accountability in pet welfare management.

The project is developed using standard web technologies and follows modern software engineering practices, including version control with GitHub and structured local development workflows.

---

## Problem It Solves
Currently, pet-related services such as adoption, lost and found reporting, and medical treatment requests are handled through fragmented platforms or offline processes. This leads to several issues:

- Difficulty in maintaining and tracking pet medical records  
- Inefficient and non-transparent adoption processes  
- Delayed response to lost, found, or injured animals  
- Reduced trust and accountability among stakeholders  

PetHaven addresses these problems by providing a centralized, secure, and role-based digital platform that integrates all core pet welfare workflows into one system.

---

## Target Users (Personas)

### Pet Owners
Individuals who own pets and need to manage pet profiles, medical and vaccination records, adoption processes, and veterinary appointments.

### General Users
Members of the public who want to report lost, found, or injured animals and browse pets available for adoption.

### Animal Shelters
Verified shelters responsible for managing adoption listings, reviewing adoption applications, and coordinating shelter visits.

### Veterinarians
Licensed veterinarians who handle treatment requests, update medical records, and manage veterinary appointments.

### System Administrators
Administrators responsible for verifying shelters and veterinarians, monitoring system activity, and ensuring data integrity and security.

---

## Vision Statement
To create a trusted, centralized digital ecosystem that enhances pet welfare by enabling ethical adoption, timely medical care, and efficient collaboration among all stakeholders involved in animal care and protection.

---

## Key Features / Goals

- Secure user registration and role-based authentication  
- Centralized management of pet profiles and medical records  
- Transparent and ethical pet adoption workflow  
- Lost, found, and injured pet reporting system  
- Veterinary appointment booking and treatment tracking  
- Verification and monitoring of shelters and veterinarians using the web application 

---

## Success Metrics
- **User Role Coverage:** 100% of defined user roles (General User, Pet Owner, Shelter, Veterinarian, Administrator) can successfully authenticate and access only their permitted features.
- **Adoption Workflow Accuracy:** At least **95% of adoption requests** progress through submission, review, and approval or rejection stages without workflow errors or incorrect status updates.
- **Reporting and Medical Record Consistency:** **100% of lost, found, injured, and medical records** are correctly created, stored, and retrievable without data loss or duplication during normal system usage.
- **Data Integrity:** **Zero critical data inconsistencies** are observed between user profiles, pet records, adoption records, and medical records during testing scenarios.
- **System Reliability:** The system remains operational for **at least 99% of normal usage time** during local testing, with no crashes during core workflows.
- **Verification Effectiveness:** **100% of shelters and veterinarians** are verified by an administrator before being allowed to list pets, approve adoptions, or create medical records.

---

## Assumptions

- Users have access to a web-enabled device and internet connectivity  
- Users are willing to register and provide basic information  
- Shelters and veterinarians submit valid documents for verification  
- The application is developed and tested in a local development environment  

---

## Constraints

- Development limited to an academic semester timeline  
- Use of standard web technologies  
- Focus on clarity and usability rather than advanced UI complexity  
- No dependency on paid cloud services  
- Development carried out by students with intermediate technical skills  

---

## Branching Strategy

This project follows **GitHub Flow** for version control.

- The `main` branch contains stable and deployable code  
- Development work is done using short-lived **feature branches**  
- Each feature branch focuses on a specific task or change  
- Feature branches are merged back into `main` after completion  

---

## MoSCoW Prioritization

### Must Have
- User registration and login
- Reporting of lost, found, and injured animals
- Browsing pets available for adoption
- Applying for pet adoption
- Review, approval, and status update of adoption applications by shelters
- Veterinary appointment booking

### Should Have
- Uploading and managing pet medical and vaccination records
- Shelter visit schedule management and slot selection
- Veterinarian case and appointment management
- Verification of shelters and veterinarians by admin

### Could Have
- System usage and adoption reports
- Administrative monitoring dashboard
- Advanced search and filtering options

### Won’t Have (Current Phase)
- Notification and alert system
- Payment and donation integration
- Mobile application support

---
## Quick Start – Local Development

### Prerequisites
- Docker Desktop installed on the local machine

### Steps to Run the Application
1. Clone the repository to your local system.
2. Navigate to the backend directory:  
   cd backend
3. Build the Docker image:  
   docker build -t pethaven-backend .
4. Run the Docker container:  
   docker run -p 5000:5000 pethaven-backend
5. Open a web browser and visit:  
   http://localhost:5000

---

## Local Development Tools
- **Visual Studio Code** – Code editor used for writing and managing the project source files.
- **Docker Desktop** – Used to containerize and run the backend application locally.
- **Python** – Programming language used for implementing the backend service.
- **Flask** – Lightweight web framework used to create the backend API.
- **Git & GitHub** – Used for version control, collaboration, and project repository management.

---

## Software Design

The PetHaven system adopts a layered client–server architecture to clearly separate presentation, application logic, data management, and deployment responsibilities. Role-Based Access Control is implemented to enforce secure and structured permissions across General Users, Shelters, Veterinarians, and Administrators. The backend is structured into modular services with clear workflow separation between adoption, reporting, and veterinary processes to ensure high cohesion and low coupling. The backend is containerized using Docker to provide a consistent, portable, and maintainable execution environment.

This structure improves maintainability, allows independent evolution of modules, and supports future scalability. 

All architecture diagrams, editable Draw.io files, and UI wireframes are available in the `docs/design/` directory.

### Architecture Diagram

[View Architecture Diagram](docs/design/PetHaven_Architecture.png)
