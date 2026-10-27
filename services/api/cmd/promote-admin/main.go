package main

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"os"
	"strings"

	_ "github.com/jackc/pgx/v5/stdlib"
)

func main() {
	if len(os.Args) != 2 {
		fmt.Fprintln(os.Stderr, "usage: go run ./cmd/promote-admin <verified-email>")
		os.Exit(2)
	}
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		fmt.Fprintln(os.Stderr, "DATABASE_URL is required")
		os.Exit(2)
	}
	email := strings.TrimSpace(strings.ToLower(os.Args[1]))
	db, err := sql.Open("pgx", dsn)
	if err != nil {
		fatal(err)
	}
	defer db.Close()
	result, err := db.ExecContext(context.Background(), `UPDATE users SET role = 'admin', updated_at = now() WHERE lower(email) = $1 AND email_verified = true`, email)
	if err != nil {
		fatal(err)
	}
	count, err := result.RowsAffected()
	if err != nil {
		fatal(err)
	}
	if count == 0 {
		var exists bool
		err = db.QueryRow(`SELECT EXISTS (SELECT 1 FROM users WHERE lower(email) = $1)`, email).Scan(&exists)
		if err != nil {
			fatal(err)
		}
		if !exists {
			fatal(errors.New("no user exists for that email"))
		}
		fatal(errors.New("email is not verified; administrator role was not changed"))
	}
	fmt.Println("verified user is an administrator")
}

func fatal(err error) { fmt.Fprintln(os.Stderr, err); os.Exit(1) }
