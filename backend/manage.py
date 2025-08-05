#!/usr/bin/env python
import sys
import click
from app.monitoring.schedule_monitor import ScheduleMonitor

@click.group()
def cli():
    """WhatsApp Scheduler Management Commands"""
    pass

@cli.command()
@click.option('--hours', default=24, help='Number of hours to analyze')
def monitor_timing(hours):
    """Monitor message timing accuracy"""
    monitor = ScheduleMonitor()
    try:
        monitor.analyze_timing_accuracy(hours_back=hours)
        monitor.check_stuck_messages()
    finally:
        monitor.close()

@cli.command()
def check_stuck():
    """Check for stuck messages only"""
    monitor = ScheduleMonitor()
    try:
        monitor.check_stuck_messages()
    finally:
        monitor.close()

if __name__ == "__main__":
    cli()