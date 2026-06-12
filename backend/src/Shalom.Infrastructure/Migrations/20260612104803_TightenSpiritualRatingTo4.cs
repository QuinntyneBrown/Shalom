using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Shalom.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class TightenSpiritualRatingTo4 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "CK_DailyCheckIns_SpiritualRating",
                table: "DailyCheckIns");

            migrationBuilder.AddCheckConstraint(
                name: "CK_DailyCheckIns_SpiritualRating",
                table: "DailyCheckIns",
                sql: "[SpiritualRating] BETWEEN 1 AND 4");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "CK_DailyCheckIns_SpiritualRating",
                table: "DailyCheckIns");

            migrationBuilder.AddCheckConstraint(
                name: "CK_DailyCheckIns_SpiritualRating",
                table: "DailyCheckIns",
                sql: "[SpiritualRating] BETWEEN 1 AND 5");
        }
    }
}
