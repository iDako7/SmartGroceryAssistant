FROM golang:1.22-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o user-service ./cmd/main.go

FROM alpine:3.19
WORKDIR /app
COPY --from=builder /app/user-service .
EXPOSE 4001
CMD ["./user-service"]
