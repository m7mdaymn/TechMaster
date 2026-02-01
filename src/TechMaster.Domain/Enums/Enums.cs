namespace TechMaster.Domain.Enums;

public enum UserRole
{
    Student = 1,
    Instructor = 2,
    Admin = 3
}

public enum CourseStatus
{
    Draft = 1,
    Published = 2,
    Archived = 3,
    UnderReview = 4,
    Rejected = 5
}

public enum CourseType
{
    Free = 1,
    Paid = 2
}

public enum SessionType
{
    Video = 0,
    Live = 1,
    Recorded = 2,
    Article = 3,
    Quiz = 4,
    Assignment = 5
}

public enum MaterialType
{
    PDF = 1,
    Video = 2,
    Link = 3,
    Document = 4
}

public enum EnrollmentStatus
{
    Pending = 1,
    PaymentPending = 2,
    Approved = 3,
    Rejected = 4,
    Completed = 5
}

public enum QuizType
{
    Session = 1,
    Module = 2,
    Course = 3
}

public enum BadgeType
{
    CourseCompletion = 1,
    QuizMaster = 2,
    FastLearner = 3,
    Consistent = 4,
    TopPerformer = 5
}

public enum NotificationType
{
    CourseEnrollment = 1,
    PaymentApproved = 2,
    NewSession = 3,
    QuizAvailable = 4,
    CertificateReady = 5,
    Announcement = 6,
    ChatMessage = 7,
    BadgeEarned = 8
}

public enum InternshipStatus
{
    Open = 1,
    Closed = 2,
    InProgress = 3
}

public enum InternshipApplicationStatus
{
    Pending = 1,
    Accepted = 2,
    Rejected = 3,
    InProgress = 4,
    Completed = 5
}

public enum TaskType
{
    Assignment = 1,
    Project = 2,
    Quiz = 3,
    Presentation = 4,
    CodeReview = 5,
    Report = 6
}

public enum SubmissionStatus
{
    Submitted = 1,
    UnderReview = 2,
    NeedsRevision = 3,
    Approved = 4,
    Rejected = 5,
    Graded = 6
}
