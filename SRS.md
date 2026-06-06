# Software Requirements Specification (SRS)

## OA Practice Simulator

**Version:** 1.0
**Prepared For:** Academic/Project Development
**Document Type:** Software Requirements Specification

---

# 1. Introduction

## 1.1 Purpose

The purpose of this system is to provide a realistic Online Assessment (OA) practice environment for students preparing for coding interviews and recruitment tests. The platform simulates common OA restrictions and workflows, allowing users to practice solving coding problems under assessment-like conditions.

The system does not require user registration or login. Users can immediately start practicing coding questions sourced from publicly available programming problem repositories such as LeetCode and GeeksforGeeks references.

---

## 1.2 Scope

The OA Practice Simulator will:

* Provide randomly selected coding questions.
* Provide a Daily Challenge question.
* Simulate online assessment monitoring procedures.
* Request camera, microphone, and fullscreen permissions.
* Display monitoring status indicators.
* Allow users to solve coding problems in an integrated editor.
* Execute and evaluate submitted solutions against predefined test cases.
* Provide detailed feedback after submission.
* Generate a realistic OA experience without requiring user authentication.

---

## 1.3 Intended Audience

* Students preparing for coding interviews.
* Placement candidates.
* Competitive programmers.
* Software developers practicing technical assessments.

---

# 2. Overall Description

## 2.1 Product Perspective

The system is a standalone web application consisting of:

* Frontend User Interface
* Coding Editor
* Question Management Module
* Submission Evaluation Engine
* OA Monitoring Simulation Module

---

## 2.2 Product Functions

### Question Management

* Fetch random coding problems.
* Display daily coding challenge.
* Categorize questions by difficulty.
* Show problem statements and examples.

### OA Simulation

* Request fullscreen mode.
* Request camera permission.
* Request microphone permission.
* Detect multiple monitor setup (where browser capabilities permit).
* Display OA compliance indicators.
* Show warnings for exiting fullscreen.
* Track tab switching events.

### Coding Environment

* Code editor with syntax highlighting.
* Language selection.
* Run code against sample test cases.
* Submit final solution.

### Evaluation System

* Execute code in sandbox environment.
* Compare outputs against expected results.
* Display pass/fail status.
* Show execution metrics.

---

## 2.3 User Characteristics

Users should have:

* Basic computer literacy.
* Familiarity with coding assessments.
* Modern web browser.

No account creation is required.

---

## 2.4 Constraints

* Browser permission restrictions may limit monitoring capabilities.
* Full monitor detection depends on browser APIs.
* Camera and microphone access require user consent.
* No persistent user data storage.

---

# 3. Functional Requirements

---

## FR-1 Question Retrieval

### Description

The system shall provide coding questions for practice.

### Inputs

* Random Question button
* Daily Question button

### Outputs

* Question statement
* Constraints
* Examples
* Difficulty level

### Acceptance Criteria

* Question loads within 3 seconds.
* Questions display correctly.

---

## FR-2 Random Question Generation

### Description

The system shall provide a randomly selected coding question.

### Workflow

1. User clicks "Random Question".
2. System retrieves question.
3. Question displayed in coding workspace.

### Priority

High

---

## FR-3 Daily Question

### Description

The system shall provide one predefined daily challenge question.

### Workflow

1. User selects Daily Challenge.
2. System displays current daily question.

### Priority

High

---

## FR-4 Fullscreen Request

### Description

The system shall request fullscreen mode before starting assessment.

### Workflow

1. User clicks Start Assessment.
2. Browser fullscreen request triggered.
3. Status indicator updated.

### Priority

High

---

## FR-5 Camera Permission Monitoring

### Description

The system shall request access to the user's camera.

### Workflow

1. Camera permission requested.
2. Permission status displayed.

### Outputs

* Camera Active
* Camera Denied

### Priority

Medium

---

## FR-6 Microphone Permission Monitoring

### Description

The system shall request access to microphone.

### Workflow

1. Microphone permission requested.
2. Status displayed.

### Outputs

* Microphone Active
* Microphone Denied

### Priority

Medium

---

## FR-7 Multi-Monitor Detection Indicator

### Description

The system shall attempt to determine whether multiple displays are connected using available browser APIs and user screen information.

### Outputs

* Single Display Detected
* Multiple Displays Possible
* Detection Unavailable

### Note

This feature is informational and may not be accurate due to browser security limitations.

### Priority

Low

---

## FR-8 Assessment Compliance Panel

### Description

The system shall display a compliance dashboard.

### Indicators

* Fullscreen Status
* Camera Status
* Microphone Status
* Tab Switching Count
* Window Focus Status
* Display Detection Status

### Priority

High

---

## FR-9 Tab Switch Detection

### Description

The system shall monitor browser visibility changes.

### Events

* Tab change
* Window minimize
* Loss of focus

### Outputs

* Warning notification
* Event counter update

### Priority

High

---

## FR-10 Code Editor

### Description

The system shall provide an integrated coding environment.

### Features

* Syntax highlighting
* Auto indentation
* Line numbering
* Theme support

### Supported Languages

* C++
* Java
* Python
* JavaScript

### Priority

High

---

## FR-11 Run Code

### Description

The user shall be able to execute code against sample test cases.

### Inputs

* Source code
* Selected language

### Outputs

* Console output
* Execution result

### Priority

High

---

## FR-12 Submit Solution

### Description

The user shall submit code for evaluation.

### Workflow

1. User clicks Submit.
2. Code sent to evaluation engine.
3. Test cases executed.
4. Results returned.

### Priority

High

---

## FR-13 Solution Evaluation

### Description

The system shall evaluate submissions.

### Metrics

* Passed test cases
* Failed test cases
* Runtime
* Memory usage

### Outputs

* Verdict

  * Accepted
  * Wrong Answer
  * Runtime Error
  * Compilation Error
  * Time Limit Exceeded

### Priority

High

---

## FR-14 Assessment Summary

### Description

The system shall display assessment results.

### Information

* Problem solved status
* Number of passed test cases
* Runtime
* Submission timestamp
* Compliance events

### Priority

High

---

# 4. Non-Functional Requirements

## NFR-1 Performance

* Question loading under 3 seconds.
* Code execution response under 5 seconds.
* UI interactions under 200 ms.

---

## NFR-2 Usability

* Responsive design.
* Mobile and desktop compatibility.
* Simple navigation.

---

## NFR-3 Reliability

* 99% frontend availability.
* Graceful handling of permission denial.

---

## NFR-4 Security

* Secure code execution sandbox.
* Isolation of user-submitted code.
* Prevention of malicious execution.

---

## NFR-5 Scalability

The system should support:

* 1,000 concurrent users
* Future integration of:

  * User accounts
  * Contest mode
  * Leaderboards
  * AI feedback

---

# 5. System Architecture

### Frontend

* React.js
* Monaco Editor
* Tailwind CSS

### Backend

* Node.js
* Express.js

### Evaluation Service

* Docker Sandbox
* Judge0 API or custom execution engine

### Database (Optional)

* MongoDB
* Daily question storage
* Question metadata storage

---

# 6. Use Cases

## UC-1 Practice Random Question

**Actor:** User

**Flow:**

1. Open website.
2. Click Random Question.
3. View problem.
4. Start OA simulation.
5. Solve problem.
6. Submit code.
7. Receive result.

---

## UC-2 Daily Challenge

**Actor:** User

**Flow:**

1. Open website.
2. Click Daily Challenge.
3. View question.
4. Complete assessment.
5. Submit solution.
6. Receive evaluation.

---

## UC-3 Permission Monitoring

**Actor:** User

**Flow:**

1. Start assessment.
2. Browser requests:

   * Fullscreen
   * Camera
   * Microphone
3. Compliance dashboard updates.
4. User continues assessment.

---

# 7. Future Enhancements

* AI interview feedback.
* Webcam activity analysis.
* Voice activity analysis.
* Contest mode.
* Placement company-specific OA simulations.
* Resume-linked performance reports.
* Difficulty recommendation engine.
* Mock coding interview integration.

---

# 8. Success Criteria

The system shall be considered successful if:

* Users can access questions without login.
* OA simulation environment launches successfully.
* Coding solutions can be executed and evaluated.
* Compliance indicators function correctly.
* Users receive accurate submission results.
* The platform effectively simulates a real online assessment experience.
