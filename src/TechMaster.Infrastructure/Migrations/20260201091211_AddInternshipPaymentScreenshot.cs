using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TechMaster.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddInternshipPaymentScreenshot : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "PaymentScreenshotUrl",
                table: "InternshipApplications",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PaymentScreenshotUrl",
                table: "InternshipApplications");
        }
    }
}
