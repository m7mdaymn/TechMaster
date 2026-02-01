namespace TechMaster.Application.DTOs.Certificate;

public class CertificateDto
{
    public Guid Id { get; set; }
    public string CertificateNumber { get; set; } = string.Empty;
    public string? QrCodeUrl { get; set; }
    public string? PdfUrl { get; set; }
    public DateTime IssuedAt { get; set; }
    public bool IsValid { get; set; }
    public Guid UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public Guid CourseId { get; set; }
    public string CourseName { get; set; } = string.Empty;
    public string CourseNameAr { get; set; } = string.Empty;
    public int? FinalScore { get; set; }
    public DateTime? CompletedAt { get; set; }
}

public class VerifyCertificateDto
{
    public string CertificateNumber { get; set; } = string.Empty;
}

public class CertificateVerificationResult
{
    public bool IsValid { get; set; }
    public string? Message { get; set; }
    public string? MessageAr { get; set; }
    public CertificateDto? Certificate { get; set; }
}
