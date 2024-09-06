FROM nginx

WORKDIR default.conf
ADD ./default.conf .

WORKDIR /var/www/html/AWS_FinalProject
ADD . .
