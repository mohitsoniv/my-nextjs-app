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
        SERVICE_FILE = '/etc/systemd/system/myapp.service'
        LOG_FILE = '/var/www/myapp/app.log'
    }

    stages {
        stage('Checkout Code') {
            steps {
                git 'https://github.com/mohitsoniv/my-nextjs-app.git'
            }
        }

        stage('Verify Node & NPM') {
            steps {
                sh '''
                    echo "🔧 Verifying Node.js and npm"
                    which node
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
                    echo "🏗️ Building app"
                    npm run build
                '''
            }
        }

        stage('Package App') {
            steps {
                sh '''
                    echo "📦 Packaging app"
                    mkdir -p packaged-app
                    cp -r .next public node_modules pages || true packaged-app/
                    cp package*.json next.config.* server.js app.js ecosystem.config.js || true packaged-app/
                '''
            }
        }

        stage('Add EC2 to known_hosts') {
            steps {
                sshagent(credentials: ["${SSH_KEY_ID}"]) {
                    sh '''
                        mkdir -p ~/.ssh
                        ssh-keyscan -H ${EC2_IP} >> ~/.ssh/known_hosts
                    '''
                }
            }
        }

        stage('Deploy to EC2') {
            steps {
                sshagent(credentials: ["${SSH_KEY_ID}"]) {
                    sh '''
                        echo "📤 Uploading app to EC2"
                        ssh ${EC2_HOST} "sudo mkdir -p ${DEPLOY_DIR} && sudo chown -R ${EC2_USER}:${EC2_USER} ${DEPLOY_DIR}"
                        scp -r packaged-app/* ${EC2_HOST}:${DEPLOY_DIR}
                    '''
                }
            }
        }

        stage('Start App with PM2 & Enable systemd') {
            steps {
                sshagent(credentials: ["${SSH_KEY_ID}"]) {
                    sh '''
                        ssh ${EC2_HOST} '
                            set -e
                            cd ${DEPLOY_DIR}
                            export HOST=0.0.0.0
                            export PORT=80

                            echo "🛠 Installing PM2 globally"
                            sudo npm install -g pm2

                            echo "🔄 Restarting with PM2"
                            pm2 delete ${APP_NAME} || true
                            pm2 start server.js --name ${APP_NAME} -- --port=80
                            pm2 save

                            echo "🔁 Generating systemd service"
                            pm2 startup systemd -u ${EC2_USER} --hp /home/${EC2_USER}
                        '
                    '''
                }
            }
        }

        stage('Healthcheck') {
            steps {
                sshagent(credentials: ["${SSH_KEY_ID}"]) {
                    sh '''
                        echo "🔍 Running Healthcheck"
                        sleep 5
                        curl -s -o /dev/null -w "%{http_code}" http://${EC2_IP} | grep 200 || (echo "❌ App failed health check" && exit 1)
                    '''
                }
            }
        }

        stage('Archive Logs from EC2') {
            steps {
                sshagent(credentials: ["${SSH_KEY_ID}"]) {
                    sh '''
                        echo "📥 Downloading logs from EC2"
                        scp ${EC2_HOST}:${LOG_FILE} app.log || echo "No log file found"
                    '''
                }
                archiveArtifacts artifacts: 'app.log', allowEmptyArchive: true
            }
        }
    }

    post {
        success {
            echo '✅ Deployment Complete! Visit: http://3.86.102.166'
        }
        failure {
            echo '❌ Something went wrong. Check logs and console output.'
        }
    }
}
