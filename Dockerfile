FROM openjdk:17-slim

# 安装必要工具
RUN apt-get update && apt-get install -y \
    wget \
    unzip \
    && rm -rf /var/lib/apt/lists/*

# 设置环境变量
ENV ANDROID_HOME=/opt/android-sdk
ENV PATH=${PATH}:${ANDROID_HOME}/cmdline-tools/latest/bin:${ANDROID_HOME}/platform-tools

# 安装Android SDK
RUN mkdir -p ${ANDROID_HOME}/cmdline-tools && \
    cd /tmp && \
    wget -q https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip && \
    unzip -q commandlinetools-linux-11076708_latest.zip && \
    mv cmdline-tools ${ANDROID_HOME}/cmdline-tools/latest && \
    rm commandlinetools-linux-11076708_latest.zip

# 接受许可并安装SDK组件
RUN yes | ${ANDROID_HOME}/cmdline-tools/latest/bin/sdkmanager --licenses && \
    ${ANDROID_HOME}/cmdline-tools/latest/bin/sdkmanager \
    "platform-tools" \
    "platforms;android-34" \
    "build-tools;34.0.0"

# 设置工作目录
WORKDIR /app

# 复制项目文件
COPY android /app

# 编译APK
RUN chmod +x gradlew && \
    ./gradlew assembleDebug --no-daemon --stacktrace

# 输出APK位置
CMD ["sh", "-c", "cp app/build/outputs/apk/debug/app-debug.apk /output/关键词监控.apk && ls -lh /output/关键词监控.apk"]









