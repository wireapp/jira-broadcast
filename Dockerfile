FROM hayd/alpine-deno:1.5.2

WORKDIR /app

# Prefer not to run as root.
USER deno

# These steps will be re-run upon each file change in your working directory:
COPY app.ts .
# Compile the main app so that it doesn't need to be compiled each startup/entry.
RUN deno cache app.ts

# ------------------- Wire common -----------------
# create version file
ARG release_version=development
ENV RELEASE_FILE_PATH=/app/release.txt
RUN echo $release_version > $RELEASE_FILE_PATH
# /------------------ Wire common -----------------

ENV PORT=8080
EXPOSE $PORT
CMD ["run", "--allow-net","--allow-env", "app.ts"]
