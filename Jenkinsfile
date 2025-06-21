pipeline {
    agent any

    tools {
        nodejs 'node18'
    }

    environment {
        EC2_USER = 'ubuntu'
        EC2_IP = '3.86.102.166'
        EC2_HOST = "${EC2_USER}@${EC2_IP}"
        SSH_KEY_ID = 'ec2-ssh-key'
        DEPLOY_DIR = '/var/www/myapp'
        APP_NAME = 'my-next-app'
        LOG_FILE = "${DEPLOY_DIR}/app.log"
    }

    stages {
        stage('Checkout Code') {
            steps {
                git url: 'https://github.com/mohitsoniv/my-nextjs-app.git', branch: 'master'
            }
        }

        stage('Verify Node & NPM') {
            steps {
                sh '''
                    echo "🔧 Verifying Node.js & NPM environment"
                    node -v
                    npm -v
                '''
            }
        }

        stage('Install Dependencies') {
            steps {
                sh '''
                    echo "📦 Installing dependencies"
                    npm install --legacy-peer-deps
                '''
            }
        }

        stage('Build App') {
            steps {
                sh '''
                    echo "🏗️ Building Next.js app"
                    npm run build
                '''
            }
        }

        stage('Prepare Deployment Package') {
            steps {
                sh '''
                    echo "📦 Preparing app package"
                    mkdir -p packaged-app
                    cp -r .next public node_modules || true packaged-app/
                    cp package*.json next.config.* || true packaged-app/
                '''
            }
        }

        stage('Add EC2 to known_hosts') {
            steps {
                sshagent(credentials: [env.SSH_KEY_ID]) {
                    sh '''
                        echo "🔐 Adding EC2 host to known_hosts"
                        mkdir -p ~/.ssh
                        ssh-keyscan -H ${EC2_IP} >> ~/.ssh/known_hosts
                    '''
                }
            }
        }

        stage('Deploy to EC2') {
            steps {
                sshagent(credentials: [env.SSH_KEY_ID]) {
                    sh '''
                        echo "🚀 Deploying to EC2"
                        ssh ${EC2_HOST} "sudo mkdir -p ${DEPLOY_DIR} && sudo chown -R ${EC2_USER}:${EC2_USER} ${DEPLOY_DIR}"
                        scp -r packaged-app/* ${EC2_HOST}:${DEPLOY_DIR}
                    '''
                }
            }
        }

        stage('Start App with PM2') {
  steps {
    sshagent(credentials: [env.SSH_KEY_ID]) {
      sh label: 'Start app via PM2', script: '''
        ssh ${EC2_HOST} << 'EOF'
          set -e
          cd ${DEPLOY_DIR}

          echo '🔄 Installing/updating PM2 globally'
          sudo npm install -g pm2

          echo '🧹 Cleaning previous PM2 process'
          pm2 delete ${APP_NAME} || true

          echo '▶️ Starting Next.js app via PM2'
          pm2 start npm --name ${APP_NAME} -- start -- --port=80

          echo '💾 Saving current PM2 process list'
          pm2 save

          echo '🔁 Enabling PM2 to start on reboot'
          sudo env PATH=$PATH:"$(npm root -g)"/.bin pm2 startup systemd -u ${EC2_USER} --hp /home/${EC2_USER}

          sudo systemctl enable pm2-${EC2_USER}
        EOF
      '''
    }
  }
}


        stage('Healthcheck') {
            steps {
                sshagent(credentials: [env.SSH_KEY_ID]) {
                    sh '''
                        echo "🩺 Verifying app health..."
                        sleep 5
                        STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://${EC2_IP})
                        if [ "$STATUS" -eq 200 ]; then
                            echo "✅ App is up and running"
                        else
                            echo "❌ App failed health check (HTTP $STATUS)"
                            exit 1
                        fi
                    '''
                }
            }
        }

        stage('Archive Logs') {
            steps {
                sshagent(credentials: [env.SSH_KEY_ID]) {
                    sh '''
                        echo "📥 Retrieving app logs from EC2"
                        scp ${EC2_HOST}:${LOG_FILE} app.log || echo "⚠️ No app.log found"
                    '''
                }
                archiveArtifacts artifacts: 'app.log', allowEmptyArchive: true
            }
        }
    }

    post {
        success {
            echo '✅ Deployment completed successfully!'
            echo "🌐 Visit: http://${EC2_IP}"
        }
        failure {
            echo '❌ Deployment failed. Check Jenkins logs and EC2 logs for debugging.'
        }
    }
}
