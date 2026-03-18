<template>
  <div class="dashboard">
    <!-- 头部：欢迎信息+退出按钮 -->
    <div class="header">
      <h1>🏢 建筑能耗与碳排放可视化平台</h1>
      <div class="user-info">
        <span>欢迎，{{ username }}</span>
        <el-button type="danger" @click="logout" size="small">退出登录</el-button>
      </div>
    </div>

    <!-- 日期筛选+导出区域（含导出按钮） -->
    <div class="filter-row">
      <el-date-picker
        v-model="selectedDate"
        type="date"
        placeholder="选择日期"
        @change="handleDateChange"
        format="YYYY-MM-DD"
        value-format="YYYY-MM-DD"
      />
      <el-button type="primary" @click="queryHistoryData">查询</el-button>
      <!-- 导出Excel按钮（核心） -->
      <el-button type="success" @click="exportExcel" icon="el-icon-download">导出Excel</el-button>
    </div>

    <!-- 数据卡片区域 -->
    <div class="card-row">
      <el-card class="card-item" :class="{ warning: power > WARN_THRESHOLD }">
        <div class="card-label">🏠 今日总用电量</div>
        <div class="card-value">{{ power }} kWh</div>
        <div class="warning-tip" v-if="power > WARN_THRESHOLD">⚠️ 能耗超标！</div>
      </el-card>
      <el-card class="card-item">
        <div class="card-label">🌱 今日总碳排放</div>
        <div class="card-value">{{ carbon.toFixed(2) }} kgCO₂</div>
      </el-card>
      <el-card class="card-item">
        <div class="card-label">📉 昨日同比变化</div>
        <!-- 修复：三元运算符用对象语法 -->
        <div class="card-value" :class="{ rise: carbonChange > 0, fall: carbonChange <= 0 }">
          {{ carbonChange > 0 ? '+' : '' }}{{ carbonChange.toFixed(1) }}%
        </div>
      </el-card>
    </div>

    <!-- 图表区域：小时趋势+楼层占比 -->
    <div class="chart-row">
      <el-card class="chart-item trend-charts">
        <div class="chart-title">⚡ 24小时能耗/碳排放趋势</div>
        <div class="trend-chart-wrap">
          <div ref="powerRef" class="chart-box power-chart" style="width: 100%; height: 400px;"></div>
          <div ref="carbonRef" class="chart-box carbon-chart" style="width: 100%; height: 400px;"></div>
        </div>
      </el-card>
      <el-card class="chart-item pie-chart-wrap">
        <div class="chart-title">🏡 各楼层碳排放占比</div>
        <div ref="pieRef" class="chart-box floor-pie-chart" style="width: 100%; height: 450px;"></div>
      </el-card>
    </div>

    <!-- 新增：月度碳排放对比图表 -->
    <el-card class="chart-item month-chart-wrap">
      <div class="chart-title">📊 月度碳排放对比（近6个月）</div>
      <div ref="monthRef" class="chart-box month-chart" style="width: 100%; height: 400px;"></div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
// ✅ 修复：xlsx 改为命名导入
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

// 路由+用户信息
const router = useRouter()
const username = localStorage.getItem('username') || '管理员'

// 常量配置
const WARN_THRESHOLD = 1300
const FLOOR_DATA = [{ name: '1层', value: 120 }, { name: '2层', value: 180 }, { name: '3层', value: 150 }, { name: '4层', value: 90 }, { name: '5层', value: 80 }]

// 响应式数据
const power = ref(1280)
const carbon = ref(1280 * 0.5804)
const carbonChange = ref(-2.4)
const selectedDate = ref('')

// 图表容器 ref（修复ECharts宽高警告）
const powerRef = ref(null)
const carbonRef = ref(null)
const pieRef = ref(null)
const monthRef = ref(null)

// 图表实例
let powerChart = null
let carbonChart = null
let pieChart = null
let monthChart = null
let updateInterval = null

// 1. 直接使用模拟数据（不再请求后端，消除网络错误）
const getRealtimeData = () => {
  power.value = 1280
  carbon.value = 1280 * 0.5804
  carbonChange.value = -2.4
  
  if (power.value > WARN_THRESHOLD) {
    ElMessage.warning('⚠️ 能耗超标！当前' + power.value + 'kWh')
  }
}

// 2. 查询历史数据（直接用模拟数据）
const queryHistoryData = () => {
  if (!selectedDate.value) {
    ElMessage.error('请选择查询日期！')
    return
  }
  
  ElMessage.success('数据查询成功！')
  powerChart.setOption({ 
    xAxis: { data: ['00:00','02:00','04:00','06:00','08:00','10:00','12:00','14:00','16:00','18:00','20:00','22:00'] }, 
    series: [{ data: [120, 100, 90, 110, 210, 180, 200, 190, 220, 250, 230, 180] }] 
  })
  carbonChart.setOption({ 
    xAxis: { data: ['00:00','02:00','04:00','06:00','08:00','10:00','12:00','14:00','16:00','18:00','20:00','22:00'] }, 
    series: [{ data: [69.65, 58.04, 52.24, 63.84, 121.88, 104.47, 116.08, 110.28, 127.69, 145.10, 133.49, 104.47] }] 
  })
}

// 3. 导出Excel核心功能（用模拟数据）
const exportExcel = () => {
  if (!selectedDate.value) {
    ElMessage.error('请先选择要导出的日期！')
    return
  }
  
  ElMessage.success('Excel导出成功！')
  // 模拟数据导出
  const mockData = [
    { "日期": selectedDate.value, "时段": "00:00", "能耗(kWh)": 120, "碳排放(kgCO₂)": 69.65 },
    { "日期": selectedDate.value, "时段": "02:00", "能耗(kWh)": 100, "碳排放(kgCO₂)": 58.04 },
    { "日期": selectedDate.value, "时段": "04:00", "能耗(kWh)": 90, "碳排放(kgCO₂)": 52.24 },
    { "日期": selectedDate.value, "时段": "06:00", "能耗(kWh)": 110, "碳排放(kgCO₂)": 63.84 },
    { "日期": selectedDate.value, "时段": "08:00", "能耗(kWh)": 210, "碳排放(kgCO₂)": 121.88 },
  ]
  const workbook = XLSX.utils.book_new()
  const worksheet = XLSX.utils.json_to_sheet(mockData)
  XLSX.utils.book_append_sheet(workbook, worksheet, '碳排放数据')
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
  const blob = new Blob([excelBuffer], { type: 'application/octet-stream' })
  saveAs(blob, '建筑碳排放数据_' + selectedDate.value + '.xlsx')
}

// 4. 退出登录
const logout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('username')
  ElMessage.success('退出成功！')
  router.push('/login')
}

// 5. 初始化所有图表（用ref获取容器，修复ECharts警告）
const initCharts = () => {
  // 5.1 能耗趋势图
  powerChart = echarts.init(powerRef.value)
  powerChart.setOption({
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { 
      type: 'category', 
      data: ['00:00','02:00','04:00','06:00','08:00','10:00','12:00','14:00','16:00','18:00','20:00','22:00'] 
    },
    yAxis: { type: 'value', name: '能耗 (kWh)' },
    series: [{ 
      name: '能耗数值', 
      type: 'line', 
      smooth: true, 
      data: [120, 100, 90, 110, 210, 180, 200, 190, 220, 250, 230, 180],
      lineStyle: { width: 3, color: '#3b82f6' },
      itemStyle: { color: '#3b82f6' },
      areaStyle: { 
        color: new echarts.graphic.LinearGradient(0,0,0,1,[
          {offset:0,color:'rgba(59,130,246,0.4)'},
          {offset:1,color:'rgba(59,130,246,0.05)'}
        ])
      }
    }]
  })

  // 5.2 碳排放趋势图
  carbonChart = echarts.init(carbonRef.value)
  carbonChart.setOption({
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { 
      type: 'category', 
      data: ['00:00','02:00','04:00','06:00','08:00','10:00','12:00','14:00','16:00','18:00','20:00','22:00'] 
    },
    yAxis: { type: 'value', name: '碳排放 (kgCO₂)' },
    series: [{ 
      name: '碳排放数值', 
      type: 'line', 
      smooth: true, 
      data: [69.65, 58.04, 52.24, 63.84, 121.88, 104.47, 116.08, 110.28, 127.69, 145.10, 133.49, 104.47],
      lineStyle: { width: 3, color: '#10b981' },
      itemStyle: { color: '#10b981' },
      areaStyle: { 
        color: new echarts.graphic.LinearGradient(0,0,0,1,[
          {offset:0,color:'rgba(16,185,129,0.4)'},
          {offset:1,color:'rgba(16,185,129,0.05)'}
        ])
      }
    }]
  })

  // 5.3 楼层占比饼图
  pieChart = echarts.init(pieRef.value)
  pieChart.setOption({
    tooltip: { trigger: 'item', formatter: '{b}: {c} kgCO₂ ({d}%)' },
    legend: { orient: 'horizontal', bottom: '10px', left: 'center', textStyle: { fontSize: 12 } },
    series: [{ 
      name: '碳排放占比', 
      type: 'pie', 
      radius: ['35%', '65%'], 
      center: ['50%', '45%'], 
      data: FLOOR_DATA,
      color: ['#4f46e5', '#a3e635', '#475569', '#fb923c', '#06b6d4'],
      label: { show: true, formatter: '{b}\n{c} kgCO₂', fontSize: 12 },
      labelLine: { length: 15, length2: 20 }
    }]
  })

  // 5.4 新增：月度对比柱状图
  monthChart = echarts.init(monthRef.value)
  monthChart.setOption({
    tooltip: { trigger: 'axis' },
    legend: { data: ['能耗(kWh)', '碳排放(kgCO₂)'], top: 0 },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      data: ['2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06']
    },
    yAxis: { type: 'value' },
    series: [
      {
        name: '能耗(kWh)',
        type: 'bar',
        data: [5200, 4800, 5500, 4900, 5800, 6200],
        itemStyle: { color: '#3b82f6' }
      },
      {
        name: '碳排放(kgCO₂)',
        type: 'bar',
        data: [3018, 2786, 3192, 2844, 3366, 3600],
        itemStyle: { color: '#10b981' }
      }
    ]
  })

  // 窗口大小变化时刷新图表
  window.addEventListener('resize', () => {
    powerChart?.resize()
    carbonChart?.resize()
    pieChart?.resize()
    monthChart?.resize()
  })
}

// 生命周期：页面加载
onMounted(async () => {
  // 登录态校验
  if (!localStorage.getItem('token')) {
    ElMessage.error('请先登录！')
    router.push('/login')
    return
  }
  // 等待DOM渲染完成后初始化图表
  await nextTick()
  initCharts()
  getRealtimeData()
  // 5秒刷新一次实时数据
  updateInterval = setInterval(getRealtimeData, 5000)
})

// 生命周期：页面卸载
onUnmounted(() => {
  clearInterval(updateInterval)
  // 销毁图表释放内存
  powerChart?.dispose()
  carbonChart?.dispose()
  pieChart?.dispose()
  monthChart?.dispose()
  window.removeEventListener('resize', () => {})
})

// 日期选择事件
const handleDateChange = (val) => {}
</script>

<style scoped>
/* 全局容器 */
.dashboard { 
  padding: 24px; 
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); 
  min-height: 100vh; 
  box-sizing: border-box; 
}

/* 头部样式 */
.header { 
  display: flex; 
  justify-content: space-between; 
  align-items: center; 
  margin-bottom: 20px; 
}
.user-info { 
  display: flex; 
  align-items: center; 
  gap: 10px; 
}

/* 筛选区域 */
.filter-row { 
  margin-bottom: 20px; 
  display: flex; 
  gap: 12px; 
  align-items: center; 
}
.el-date-picker { width: 200px; }

/* 数据卡片 */
.card-row { 
  display: flex; 
  gap: 20px; 
  margin-bottom: 20px; 
  flex-wrap: wrap; 
}
.card-item { 
  flex: 1; 
  min-width: 220px; 
  padding: 20px; 
  background: #ffffff; 
  border-radius: 10px; 
  box-shadow: 0 2px 12px rgba(0,0,0,0.06); 
  transition: all 0.3s ease; 
  position: relative; 
}
.card-item:hover { 
  transform: translateY(-3px); 
  box-shadow: 0 4px 16px rgba(0,0,0,0.1); 
}
.card-item.warning { 
  border: 2px solid #ef4444; 
  background: rgba(239,68,68,0.05); 
}
.card-label { 
  font-size: 14px; 
  color: #64748b; 
  margin-bottom: 8px; 
}
.card-value { 
  font-size: 28px; 
  font-weight: bold; 
  color: #0f172a; 
}
.warning-tip { 
  position: absolute; 
  top: 10px; 
  right: 10px; 
  color: #ef4444; 
  font-size: 12px; 
  font-weight: 600; 
}
.rise { color: #ef4444; } 
.fall { color: #10b981; }

/* 图表区域 */
.chart-row { 
  display: flex; 
  gap: 20px; 
  margin-bottom: 20px; 
  flex-wrap: wrap; 
}
.chart-item { 
  flex: 1; 
  min-width: 350px; 
  padding: 20px; 
  background: #ffffff; 
  border-radius: 10px; 
  box-shadow: 0 2px 12px rgba(0,0,0,0.06); 
}
.trend-charts { flex: 2; } 
.pie-chart-wrap { flex: 1; }
.month-chart-wrap { 
  flex: 1; 
  min-width: 350px; 
}
.chart-title { 
  font-size: 16px; 
  font-weight: 600; 
  color: #334155; 
  margin-bottom: 12px; 
}
.trend-chart-wrap { 
  display: flex; 
  gap: 20px; 
}
</style>
