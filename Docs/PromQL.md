[ PromQL Queries Provided by Phind ]
  * CPU Utilization: `100 - (avg by (instance) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)`
  * Memory Usage: `100 * (1 - ((avg_over_time(node_memory_MemFree_bytes[10m]) + avg_over_time(node_memory_Cached_bytes[10m]) + avg_over_time(node_memory_Buffers_bytes[10m])) / avg_over_time(node_memory_MemTotal_bytes[10m])))`
  * Temperature: `node_hwmon_temp_celsius`
  * Disk Usage: `node_filesystem_avail_bytes`
  * Network - Bytes Received: `rate(node_network_receive_bytes_total[5m])`
  * Network - Bytes Transmitted: `rate(node_network_transmit_bytes_total[5m])`
  * Disk I/O: `node_network_transmit_bytes_total`
  * Load Average 1m: `node_load1`
  * Load Average 5m: `node_load5`
  * Load Average 15m: `node_load15`
  * Number of Running Processes: `node_procs_running`