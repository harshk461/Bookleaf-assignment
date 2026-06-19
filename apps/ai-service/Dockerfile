FROM python:3.12-slim
WORKDIR /app
COPY apps/ai-service/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY apps/ai-service/app ./app
COPY apps/ai-service/docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh
ENV PORT=8000
EXPOSE 8000
CMD ["./docker-entrypoint.sh"]
