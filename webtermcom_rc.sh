#!/bin/sh
#
# $FreeBSD$
#
# PROVIDE: webtermcom
# REQUIRE: DAEMON
# KEYWORD: shutdown
#
# Add the following line to /etc/rc.conf to enable webtermcom:
#
# webtermcom_enable="YES"
#

. /etc/rc.subr

name="webtermcom"
rcvar="webtermcom_enable"

load_rc_config $name

: ${webtermcom_enable:="NO"}
: ${webtermcom_user:="www"}
: ${webtermcom_config:="/usr/local/etc/cloudbsd/webtermcom/config.json"}
: ${webtermcom_chdir:="/usr/local/www/webtermcom"}

command="/usr/local/bin/python3.13"
command_args="-m backend.main --config ${webtermcom_config} &"
pidfile="/var/run/${name}.pid"

# According to guidelines:
# Make sure the pidfile is created in the correct location and is owned by the correct user, 
# and removed when the service stops.

start_cmd="${name}_start"
stop_postcmd="${name}_stop_post"

webtermcom_start()
{
    echo "Starting ${name}."
    cd ${webtermcom_chdir}
    /usr/sbin/daemon -p ${pidfile} -u ${webtermcom_user} ${command} -m backend.main --config ${webtermcom_config}
}

webtermcom_stop_post()
{
    rm -f ${pidfile}
}

run_rc_command "$1"
