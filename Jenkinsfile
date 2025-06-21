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
                    cp -r .next public node_modules packaged-app/
                    cp package*.json next.config.* ecosystem.config.js || true packaged-app/
                '''
            }
        }

        stage('Add EC2 to known_hosts') {
            steps {
                sshagent(credentials: ["${SSH_KEY_ID}"]) {
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
                sshagent(credentials: ["${SSH_KEY_ID}"]) {
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
                sshagent(credentials: ["${SSH_KEY_ID}"]) {
                    sh """
                        ssh ${EC2_HOST} bash -c '
                            set -e
                            cd ${DEPLOY_DIR}
                            export HOST=0.0.0.0
                            export PORT=80

                            echo "🔄 Installing PM2 globally"
                            sudo npm install -g pm2

                            echo "🧹 Cleaning previous PM2 process"
                            pm2 delete ${APP_NAME} || true

                            echo "▶️ Starting Next.js app via PM2"
                            pm2 start npm --name "${APP_NAME}" -- start -- --port=80

                            echo "💾 Saving PM2 process list"
                            pm2 save

                            echo "🔁 Enabling PM2 startup with systemd"
                            sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u ${EC2_USER} --hp /home/${EC2_USER}
                        '
                    """
                }
            }
        }

        stage('Healthcheck') {
            steps {
                sshagent(credentials: ["${SSH_KEY_ID}"]) {
                    sh '''
                        echo "🔍 Running healthcheck"
                        sleep 5
                        curl -s -o /dev/null -w "%{http_code}" http://${EC2_IP} | grep 200 || (echo "❌ Healthcheck failed" && exit 1)
                    '''
                }
            }
        }

        stage('Archive Logs') {
            steps {
                sshagent(credentials: ["${SSH_KEY_ID}"]) {
                    sh '''
                        echo "📥 Fetching logs from EC2"
                        scp ${EC2_HOST}:${LOG_FILE} app.log || echo "⚠️ No logs found"
                    '''
                }
                archiveArtifacts artifacts: 'app.log', allowEmptyArchive: true
            }
        }
    }

    post {
        success {
            echo '✅ Deployment successful: http://${EC2_IP}'
        }
        failure {
            echo '❌ Deployment failed. Check Jenkins and EC2 logs.'
        }
    }
}
