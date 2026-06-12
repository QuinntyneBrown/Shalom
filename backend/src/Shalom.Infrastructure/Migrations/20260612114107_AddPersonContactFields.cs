using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Shalom.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddPersonContactFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Phone",
                table: "People",
                type: "nvarchar(30)",
                maxLength: 30,
                nullable: true);

            migrationBuilder.AddColumn<DateOnly>(
                name: "SnoozedUntil",
                table: "People",
                type: "date",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Phone",
                table: "People");

            migrationBuilder.DropColumn(
                name: "SnoozedUntil",
                table: "People");
        }
    }
}
