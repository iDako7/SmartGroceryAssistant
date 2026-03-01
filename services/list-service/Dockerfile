FROM golang:1.22-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o list-service ./cmd/main.go

FROM alpine:3.19
WORKDIR /app
COPY --from=builder /app/list-service .
EXPOSE 4002
CMD ["./list-service"]
