<template>
  <div
    style="height: 100vh; width: 100%;"
  >
    <div style="display: flex">
      <div style="width: 35%; margin: 10px 1%">
        <div class="lineChart" style="position: relative;">
          <div v-loading="!!LineDataList && lineDataIsLoading" id="line" style="width: 100%; height: 200px;position:absolute"></div>
          <div style="margin-left: 10%;">
            <el-date-picker
              v-model="year"
              type="year"
              placeholder=""
              style="width: 100px;margin-top: 1%;">
            </el-date-picker>
          </div>
        </div>
        <div style="margin: 10px 0"></div>
        <div class="lineChart" style="display: flex;white-space: pre-wrap;">
          <div style="margin-left: 10%;white-space: pre-wrap; display: flex; justify-content: center; align-items: center; position: relative;">
            <div style="position: absolute; color: white; z-index: 10;white-space: pre-wrap;">  风向<br>{{ this.windDirection }}</div>
            <div class="circle" style="--before-bg-color: conic-gradient(#061235, #061235, #089065, #16b663)"></div>
          </div>
          <div style="margin-left: 10%;white-space: pre-wrap; display: flex; justify-content: center; align-items: center; position: relative;">
            <div style="position: absolute; color: white; z-index: 10;">风速<br>{{ this.windSpeed }}</div>
            <div class="circle" style="--before-bg-color: conic-gradient(#061235, #061235, #dfe829, #e8b80a);"></div>
          </div>
          <div style=" margin-left: 10%;white-space: pre-wrap; display: flex; justify-content: center; align-items: center; position: relative;">
            <div style="position: absolute; color: white; z-index: 10;">&nbsp;&nbsp;{{ this.weather }}<br>{{ this.temperature }}</div>
            <div class="circle" style="--before-bg-color: conic-gradient(#061235, #061235, #159ace, #0635d1);"></div>
          </div>
        </div>
      </div>
      <div class="mapStyle">
        <div
          id="china_map"
          style="width: 100%; height: 450px; margin: 0, auto"
        ></div>
        <el-button
          style="position: absolute; top: 22px; left: 38%;background-color: #652fc9;border: #159ace;color: white;"
          v-show="mapName !== 'china'"
          @click="getChinaChart()"
          >全国</el-button
        >
      </div>
      <div  class="proportionChart" style="position: relative;">
        <div id="proportion" style="width:105%;height:300px;position: absolute;margin-left: -5%;"></div>
        <div style="margin-left: 40%;margin-top: -80%">
            <div style="color: white;">当前城市:  {{ this.currentcity }}</div>
            <el-date-picker
              v-model="date"
              type="date"
              style="width: 150px;">
            </el-date-picker>
        </div>
        <div style="margin-left: -30%;margin-top: 70%">
          <el-button 
            slot="footer" 
            class="dialog-footer" 
            style="background-color: #652fc9;border: #159ace;color: white;"
            @click="getCause"
            >
            成因分析
          </el-button>
        </div>
      </div>
    </div>

    <div style="display: flex">
      <div style="width: 35%; margin: 10px 1% ;">
        <div class="lineChart" style="height: 320px; overflow: hidden;"> 
          <div style="display: flex;justify-content: center; align-items: flex-start;color: white;font-size: 25px;margin-top: 20px;"> 城市AQI排行榜</div>
          <div style="display: flex;justify-content: center; align-items: flex-start;"> 
            <el-table
              :data="rankData"
              style="width: 100%;background-color: #061235c7;display: inline-block;margin-top: 10px;padding: 0;" 
              :header-cell-style="{background:'#061235', color:'white',textAlign: 'center'}"
              :cell-style="{background:'#061235c7', color:'white',textAlign: 'center'}"
              max-height="300px"
              >
              <el-table-column
                prop="rank"
                label="排名"
                width="100" 
                >
              </el-table-column>
              <el-table-column
                prop="province"
                label="省份"
                width="110">
              </el-table-column>
              <el-table-column
                prop="city"
                label="城市"
                width="110">
              </el-table-column>
              <el-table-column
                prop="AQI"
                label="AQI"
                width="100">
              </el-table-column>
              <el-table-column
                prop="grade"
                label="等级"
                width="109">
              </el-table-column>
            </el-table>
          </div>
        </div>
      </div>
      <div style="width: 62.6%; margin:10px 0">
        <div class="lineChart" style="height: 320px;display: flex;justify-content: center; align-items: center;">
          <div id="histogram" style="width: 100%;height: 100%;margin-top: 30px;"></div>
        </div>
      </div>
    </div>
    <el-dialog
      title="成因分析"
      :visible.sync="centerDialogVisible"
      width="50%"
      center>
      <div v-loading="chatDateIsLoading" element-loading-text="思考中……" style="width: 100%; min-height: 120px;">
        <div v-for="subcontent in this.analysisContent.split('\n')" :key="subcontent">
          &nbsp;&nbsp;&nbsp;&nbsp;{{ subcontent }}
        </div>
      </div>
    </el-dialog>
  </div>

</template>;

<script>
import * as echarts from "echarts";
import {baseServer} from "../js/link";
import china from "../js/china.json";
import pinyin from "pinyin";
import {calculateAqiLevel} from "../js/aqi";
echarts.registerMap("china", china);
export default {
  data() {
    return {
      percentage: 10,
      year:new Date(),
      date:new Date(),
      centerDialogVisible: false,
      isExecuting: false,
      colors: [
        { color: "#f56c6c", percentage: 20 },
        { color: "#e6a23c", percentage: 40 },
        { color: "#5cb87a", percentage: 60 },
        { color: "#1989fa", percentage: 80 },
        { color: "#6f7ad3", percentage: 100 },
      ],
      charts: "",
      propcharts:"",
      histcharts:"",
      LineDataList: [],
      lineDataIsLoading: false,
      chatDateIsLoading:false,
      windDirection: "",
      windSpeed:"",
      weather:"",
      temperature:'',
      mintemperature:[],
      maxtemperature:[],
      CO:'', 
      SO2:'',
      NO2:'',
      PM2_5:'',
      PM10:'',
      O3:'',
      analysisContent: "",
      currentcity:'',
      mapName: "china",
      MapDataList: [],
      rankData: [{
        rank:1,
        province:'山东',
        city:'济南',
        AQI:458,
        grade:"严重"
      }, {
        rank:2,
        province:'河南',
        city:'周口',
        AQI:431,
        grade:"严重"
      }, {
        rank:3,
        province:'河南',
        city:'商丘',
        AQI:427,
        grade:"严重"
      }, {
        rank:4,
        province:'山东',
        city:'临沂',
        AQI:402,
        grade:"严重"
      }]
    };
  },

  mounted() {
    this.getRank();
    this.getCityDate();
    this.drawLine();
    this.drawProportion();
    this.drawHistogram();
  },
  methods: {
    getAQIdate () {
      const citypy = this.mapName.slice(0, -1);
      const city_pinyin = pinyin(citypy,{style:"normal"}).map(function (item) {
          return item.join('');
      }).join('');
      const year = this.year.getFullYear();
      this.lineDataIsLoading = true;
      baseServer.post("annually_weather/", {city_pinyin,year})
        .then((response) => {
          const data = response.data;
          console.log(data.map(e => parseInt(e.average_aqi.value)))
          this.LineDataList = data.map(e => parseInt(e.average_aqi.value));
          this.drawLine();
        })
        .catch((e) => {
          console.error("Error:", e);
        })
        .finally(() => {
          this.lineDataIsLoading = false;
        })
    },
    getNowWeather(){
      const city = this.mapName.slice(0, -1);
      baseServer
      .post("current_weather/", {city})
        .then((response) => {
          const data = response.data;
          this.windDirection = data.result.realtime.wind.direction;
          this.windSpeed = data.result.realtime.wind.speed;
          this.weather = this.parseWeatherName(data.result.realtime.skycon);
          this.temperature = Math.round(data.result.realtime.temperature*10)/10+"°C";
          this.mintemperature = data.result.daily.temperature.map(e=>e.min);
          this.maxtemperature = data.result.daily.temperature.map(e=>e.max);
          this.drawHistogram();
        })
        .catch((e) => {
          console.error("Error:", e);
        })
    },
    parseWeatherName(code){
        switch (code) {
            case 'CLEAR_DAY':
            case 'CLEAR_NIGHT':
                return '晴';
            case 'PARTLY_CLOUDY_DAY':
            case 'PARTLY_CLOUDY_NIGHT':
                return '多云';
            case 'CLOUDY':
                return '阴';
            case 'LIGHT_HAZE':
                return '轻度雾霾';
            case 'MODERATE_HAZE':
                return '中度雾霾';
            case 'HEAVY_HAZE':
                return '重度雾霾';
            case 'LIGHT_RAIN':
                return '小雨';
            case 'MODERATE_RAIN':
                return '中雨';
            case 'HEAVY_RAIN':
                return '大雨';
            case 'STORM_RAIN':
                return '暴雨';
            case 'FOG':
                return '雾';
            case 'LIGHT_SNOW':
                return '小雪';
            case 'MODERATE_SNOW':
                return '中雪';
            case 'HEAVY_SNOW':
                return '大雪';
            case 'STORM_SNOW':
                return '暴雪';
            case 'DUST':
                return '浮尘';
            case 'SAND':
                return '沙尘';
            case 'WIND':
                return '大风';
            default:
                return '未知天气';
        }
    },
    getComponentdate(){
      const city_name = this.mapName.slice(0, -1);
      const date = this.date;
      baseServer
        .post("air_quality/", {date, city_name})
        .then((response) => {
          const data = response.data;
          this.CO = data.data.co;
          this.NO2 = data.data.no2;
          this.SO2 = data.data.so2;
          this.O3 = data.data.o3;
          this.PM2_5 = data.data.pm2_5;
          this.PM10 = data.data.pm10;
          this.drawProportion();
        })
        .catch((e) => {
          console.error("Error:", e);
        });
    },
    getCityDate(){
      baseServer
        .get("get_city")
        .then((response) => {
          const data = response.data;
          this.MapDataList = data.map((e)=>{
            return {
              name: e.data.cityname+'市',
              value: e.data.aqi
            }
          });
          console.log(this.MapDataList)
          this.setMapData();
        })
        .catch((e) => {
          console.error("Error:", e);
        });
      baseServer
        .get("get_province")
        .then((response) => {
          const data = response.data;
          console.log(data)
          data.map((e)=>{
              return {
                name: e.province,
                value: Math.round(e.aqi*10)/10
              }
            }
          ).forEach(e => {
            this.MapDataList.push(e)
          });
          console.log(this.MapDataList)
          this.setMapData();
        })
        .catch((e) => {
          console.error("Error:", e);
        });
    },
    getCause(){
      this.centerDialogVisible = true;
      const city = this.mapName.slice(0, -1);
      this.chatDateIsLoading = true;
      baseServer
        .post("gpt_analysis/", {city})
        .then((response) => {
          const data = response.data;
          this.analysisContent = data.answer;
        })
        .catch((e) => {
          console.error("Error:", e);
        })
        .finally(() => {
          this.chatDateIsLoading = false;
        });
    },
    getRank(){
      baseServer
      .get("rank")
        .then((response) => {
          const data = response.data;
          console.log(data);
          this.rankData = data.map((e)=>{
            return {
              rank: e.rank,
              province:e.province,
              city: e.cityname,
              AQI: e.aqi,
              grade: calculateAqiLevel(e.aqi)
            }
          });
          console.log(this.rankData)
        })
        .catch((e) => {
          console.error("Error:", e);
        });
    },
    //折线图
    drawLine() {
      this.charts = echarts.init(document.getElementById("line"));
      this.charts.setOption({
        title: {
          left: "40%",
          top: "5%",
          text: "该年空气AQI趋势", // 自定义
          textStyle: {
            color: "#ffffff",
          },
        },

        tooltip: {
          trigger: "axis",
        },

        legend: {
          //图例
          show:false,
          align: "right",
          left: "3%",
          top: "15%",
          data: ["近一年"], // 自定义
          textStyle: {
            color: "#ffffff",
          },
        },

        grid: {
          top: "30%",
          left: "5%",
          right: "5%",
          bottom: "5%",
          containLabel: true,
        },

        toolbox: {
          feature: {
            saveAsImage: {},
          },
        },

        // 设置x轴刻度
        xAxis: {
          type: "category",
          boundaryGap: true,
          axisTick: {
            alignWithLabel: true,
          },
          axisLabel: {
            color: "#ffffff",
          },
          data: ["1月", "2月", "3月", "4月", "5月", "6月", "7月","8月","9月","10月","11月","12月"],
        },

        // 设置y轴刻度
        yAxis: {
          type: "value",
          boundaryGap: true,
          splitNumber: 4,
          interval: 250,
          axisLabel: {
            color: "#ffffff",
          },
        },

        // 设置数据
        series: [
          {
            name: "近一年",
            type: "line",
            stack: "总量",
            data: this.LineDataList,
            areaStyle: {
              color: {
                type: "linear",
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                  {
                    offset: 0,
                    color: "rgb(255,200,213)",
                  },
                  {
                    offset: 1,
                    color: "#ffffff",
                  },
                ],
                global: false,
              },
            },
            itemStyle: {
              color: "rgb(255,96,64)",
              lineStyle: {
                color: "rgb(255,96,64)",
              },
            },
          },
        ],
      });
    },

    // 地图
    setMapData() {
      // 初始化echarts实例
      this.chinachart = echarts.init(document.getElementById("china_map"));
      // 进行相关配置
      this.chartOption = {
        tooltip: {
          // 鼠标移到图里面的浮动提示框
          formatter(params) {
            // params.data 就是series配置项中的data数据遍历
            let localValue;
            if (params.data) {
              localValue = params.data.value;
            } else {
              // 为了防止没有定义数据的时候报错写的
              localValue = 0;
              return;
            }
  
            let htmlStr = `<div style='font-size:18px;'> ${params.name}</div>
                              <p style='text-align:left;margin-top:2px;'>AQI：${localValue}</p>`;
            return htmlStr;
          },
          backgroundColor: "#4682B4", //提示标签背景颜色
          textStyle: { color: "#fff" }, //提示标签字体颜色
          padding: [5, 10, 0, 10], // 设置上下的内边距为 5,0，左右的内边距为 10
        },
        visualMap: {
          //图例
          show: true,
          bottom: 20,
          left: "0%",
          top: "70%",
          right: 0,
          bottom: 0, //定位的左上角以及右下角分别所对应的经纬度
          text: ["200", "0"],
          min: 0,
          itemHeight: 50, //图形的高度，即长条的高度。
          itemWidth: 10,
          color: [
            "#ee6666", //红色
            "#fc8452", //橙色
            "#fac858", //黄色
            "#9a60b4", //紫色
            "#ea7ccc", //淡紫
            "#3ba272", //绿色
            "#91cc75", //浅绿
            "#5470c6", //蓝色
            "#73c0de", //淡蓝
          ],
        },
        geo: {
          top: "5%",
          left: "5%",
          right: "0%",
          map: "china", // 表示中国地图
          //roam: true, // 是否开启鼠标缩放和平移漫游
          zoom: 1,
          label: {
            show: true,
            fontSize: "5",
          },
          emphasis: {
            // 地图区域的多边形 图形样式。
            borderColor: "#ff0000", //未选中的状态
            areaColor: "#D8E9FD", //背景颜色
            label: {
              show: true, //显示名称
            },
            itemStyle: {
              //选中的状态// 高亮状态下的多边形和标签样式
              shadowBlur: 20,
              shadowColor: "rgba(0, 0, 0, 0.5)",
              borderColor: "#ff0000",
              areaColor: "#B0E0E6",
            },
          },
        },
        series: [
          {
            name: "地图",
            type: "map",
            geoIndex: 0,
            zoom: 0.1,
            label: {
              show: true,
            },
            data: this.MapDataList,
          },
        ],
      };
      this.chinachart.setOption(this.chartOption);
      this.chinachart.on("click", (e) => {
        
        this.mapName = e.name;
        if (e.componentSubType == "map") {
          this.getDownData(e.name);
          console.log(this.mapName);
          console.log(this.MapDataList);
          if (this.mapName[this.mapName.length - 1] == "市" )
          {
            this.getAQIdate();
            this.getComponentdate();
            this.getNowWeather();
            console.log(this.analysisContent);
            this.currentcity = this.mapName;
          }
        }
      });
    },

    async getDownData(name) {
      try {
        const adcode = china.features.filter(
          (it) => it.properties.name === name
        )[0].properties.adcode;
        let newMapJson = await this.getMapJson(adcode);
        if (!newMapJson) {
          return;
        }
        this.$echarts.registerMap(name, newMapJson);
        this.chartOption.series[0].name = name;
        this.chartOption.geo.map = name;
        if (name == "山西省" || name == "陕西省") {
          this.chartOption.geo.top = "-36%";
          this.chartOption.geo.zoom = 0.5;
        } else if (name == "河北省") {
          this.chartOption.geo.top = "-10%";
          this.chartOption.geo.zoom = 0.7;
        } else if (name == "山东省") {
          this.chartOption.geo.top = "20%";
          this.chartOption.geo.zoom = 1;
        } else if (name == "宁夏回族自治区") {
          this.chartOption.geo.top = "-20%";
          this.chartOption.geo.zoom = 0.6;
        } else if (name == "澳门特别行政区") {
          this.chartOption.geo.top = "-30%";
          this.chartOption.geo.zoom = 0.6;
        } else if (name == "江西省") {
          this.chartOption.geo.top = "-20%";
          this.chartOption.geo.zoom = 0.6;
        } else if (name == "福建省") {
          this.chartOption.geo.top = "-10%";
          this.chartOption.geo.zoom = 0.7;
        } else if (name == "安徽省") {
          this.chartOption.geo.top = "-20%";
          this.chartOption.geo.zoom = 0.7;
        }else if (name == "湖南省") {
          this.chartOption.geo.top = "-10%";
          this.chartOption.geo.zoom = 0.7;
        } else if (name == "海南省") {
          this.chartOption.geo.top = "-35%";
          this.chartOption.geo.zoom = 0.6;
        } else if (name == "甘肃省") {
          this.chartOption.geo.top = "13%";
          this.chartOption.geo.zoom = 1.0;
        } else if (name == "云南省") {
          this.chartOption.geo.top = "-3%";
          this.chartOption.geo.zoom = 0.8;
        } else if (name == "吉林省") {
          this.chartOption.geo.top = "10%";
          this.chartOption.geo.zoom = 1.0;
        } else if (name == "青海省") {
          this.chartOption.geo.top = "20%";
          this.chartOption.geo.zoom = 1.0;
        } else if (name == "新疆维吾尔自治区") {
          this.chartOption.geo.top = "10%";
          this.chartOption.geo.zoom = 1.0;
        } else {
          this.chartOption.geo.top = "3%";
          this.chartOption.geo.zoom = 0.8;
        }
        this.chinachart.setOption(this.chartOption);
      } catch (e) {
        console.error(e);
      }
    },
    async getMapJson(cityCode) {
      let jsonData = await this.$axios
        .get(
          `https://geo.datav.aliyun.com/areas_v3/bound/${cityCode}_full.json`
        )
        .then((response) => response.data)
        .catch((e) => {
          console.error(e);
          return undefined;
        });
      return jsonData;
    },
    getChinaChart() {
      this.mapName = "china";
      this.$echarts.registerMap("china", china);
      this.chartOption.series[0].name = "china";
      this.chartOption.geo.map = "china";
      this.chartOption.geo.top = "5%";
      this.chartOption.geo.zoom = 1;
      this.chinachart.setOption(this.chartOption);
    },

    //比例图
    drawProportion() {
      this.propcharts = echarts.init(document.getElementById('proportion'));
      this.propcharts.setOption({
        grid:{
          containLabel: true 
        },
        tooltip: {
          trigger: 'item',
          formatter: "{a} <br/>{b}: {c} ({d}%)"
        },
        legend: {//图例
          show: true,
          left:"83%",
          top:"50%",
          orient: 'vertical',
          x: 'right',
          data: ['CO', 'SO₂','NO₂','PM2.5','PM10','O₃'],  //显示的百分比
          textStyle:{
            color:"#fff",
            fontSize:"15"
          },
          itemWidth: 30, // 设置图例项宽度
          itemHeight: 10 // 设置图例项高度
        },
        graphic:{
          type:'text',
          left:'center',
          top:'center',
          style:{
              text:'成分占比',     //环形中间文字及样式
              textAlign:'center',
              fill:'#fff',
              width:30,
              height:30,
              fontSize:"12"
          }
        },
        
        series: [{
          name:'',
          type: 'pie',
          radius: ['40%', '60%'],//第一个参数是内圆半径，第二个参数是外圆半径
          itemStyle: {
            normal:{
              label:{
                show:true,
                textStyle:{color:'#fff',fontSize:"14"},
                //让series 中的文字进行换行
                // formatter:function(val){
                //     return val.name.split("-").join("\n");}
              },
              title:{
                text:'aaaa'
              },
              labelLine:{
                show:true,
                lineStyle:{color:'#fff'}
              }
            },
            emphasis: {
                // show:false,
                shadowBlur: 10,
                shadowOffsetX: 0,
                shadowColor: 'rgba(0, 0, 0, 0.5)',
                textColor:'red'
            }
          },
          data: [
            {value: this.CO, name: "CO"},
            {value: this.SO2, name: 'SO₂'},
            {value: this.NO2, name: 'NO₂'},
            {value: this.PM2_5, name: 'PM2.5'},
            {value: this.PM10, name: 'PM10'},
            {value: this.O3, name: 'O₃'},
          ]
         }],
        color: ['rgb(40, 236, 236)','rgb(231, 207, 69)','rgb(255,182,193)','rgb(220,20,60)','rgb(34,139,34)','rgb(160,82,45)'] 
      })
    },
    //柱状图
    drawHistogram(){
      this.histcharts = echarts.init(document.getElementById('histogram')); 
      var histoption;
      let dataAxis = ['1','2','3','4','5','6','7','8','9','10','11','12','13','14'];
      let data = [220, 182, 191, 234, 290, 330, 310, 123, 442, 321, 90, 149, 210, 122, 133, 334, 198, 123, 125, 220];
      let yMax = 500;
      let dataShadow = [];
      for (let i = 0; i < data.length; i++) {
        dataShadow.push(yMax);
      }
      histoption = {
        title: {
          text: '未来14天温差情况',
          left:"40%",
          textStyle: {
            color: '#ffffff',
            fontSize:'25px'
          }
        },
        tooltip: {
          trigger: 'axis'
        },
        legend: {
          data: ['最低温', '最高温']
        },
        toolbox: {
          show: true,
          feature: {
            dataView: { show: true, readOnly: false },
            magicType: { show: true, type: ['line', 'bar'] },
            restore: { show: true },
            saveAsImage: { show: true }
          }
        },
        calculable: true,
        xAxis: [
          {
            type: 'category',
            data: dataAxis
          }
        ],
        yAxis: [
          {
            type: 'value'
          }
        ],
        series: [
          {
            name: '最低温',
            type: 'bar',
            data: this.mintemperature,
            markPoint: {
              data: [
                { type: 'max', name: 'Max' },
                { type: 'min', name: 'Min' }
              ]
            },
            markLine: {
              data: [{ type: 'average', name: 'Avg' }]
            }
          },
          {
            name: '最高温',
            type: 'bar',
            data: this.maxtemperature,
            markPoint: {
              data: [
                { type: 'max', name: 'Max' },
                { type: 'min', name: 'Min' }
              ]
            },
            markLine: {
              data: [{ type: 'average', name: 'Avg' }]
            }
          }
        ]
      };
      this.histcharts .setOption(histoption)
    }
  },
  watch:{
    year(newValue) {
      this.getAQIdate();
    },
    date(newValue) {
      this.getComponentdate();
    }
  }
};
</script>

<style>

.el-input__inner {
  background-color: transparent !important;
  border: #000 !important;
  color:white !important;
}

body {
  margin: 0 !important;
}
.lineChart {
  background-color: #061235c7;
  width: 100%;
  height: 220px;
  border: 0.1px solid #000;
  border-color: white;
  border-radius: 20px;
}
.mapStyle {
  background-color: #061235c7;
  width: 30%;
  height: 450px;
  margin-top: 10px;
  margin: 0 5%px;
  display: flex;
  justify-content: center;
  align-items: center;
  border: 0.1px solid #000;
  border-color: white;
  border-radius: 20px;
}

.circle {
  white-space: pre-wrap;
  position: relative;
  width: 100px;
  height: 100px;
  border-radius: 50%;
  animation: spin 2s linear infinite;
}
.circle::before,
.circle::after {
  position: absolute;
  border-radius: 50%;
}

.circle::before {
  content: "";
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: var(--before-bg-color);
}
.circle::after {
  content: '';
  display: flex;
  justify-content: center;
  align-items: center;
  color: white;
  width: 80%;
  height: 80%;
  top: 10%;
  left: 10%;
  background: #061235; /* 背景色 */
  animation: spin 2s linear infinite reverse;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
.proportionChart{
  background-color: #061235c7;
  width: 31.6%;
  height: 450px;
  margin-top: 10px;
  margin-left: 1%;
  border: 0.1px solid #000;
  border-color: white;
  border-radius: 20px;
  display: flex;
  align-items: center;
}
</style>
