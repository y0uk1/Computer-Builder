const config = {
  url: "https://api.recursionist.io/builder/computers?type=",
  type: {
    cpu: 'cpu',
    gpu: 'gpu',
    ram: 'ram',
    hdd: 'hdd',
    ssd: 'ssd'
  }
}

const initSelectedPC = {
  'cpu': {'brand': '', 'model': ''},
  'gpu': {'brand': '', 'model': ''},
  'ram': {'slot': '', 'brand': '', 'model': ''},
  'storage': {'type': '', 'size': '', 'brand': '', 'model': ''},
  'benchmark': {'gaming': 0, 'work': 0}
}

const app = Vue.createApp({
  data: () => ({
    cpu: new Object(),
    gpu: new Object(),
    ram: new Object(),
    storage: {HDD: new Object(), SSD: new Object()},
    selectedPCs: [],
    selectedPC: JSON.parse(JSON.stringify(initSelectedPC)),
  }),
  mounted: function() {
    this.createOptions(config.type.cpu, this.cpu, ['Brand', 'Model', 'Benchmark'])
    this.createOptions(config.type.gpu, this.gpu, ['Brand', 'Model', 'Benchmark'])
    this.createOptions(config.type.ram, this.ram, ['Slot', 'Brand', 'Model', 'Benchmark'], this.getSlot)
    this.createOptions(config.type.hdd, this.storage.HDD, ['Size', 'Brand', 'Model', 'Benchmark'], this.getStorageSize)
    this.createOptions(config.type.ssd, this.storage.SSD, ['Size', 'Brand', 'Model', 'Benchmark'], this.getStorageSize)
  },
  methods: {
    addPC(){
      // 入力されたパーツからベンチマークを計算する
      this.selectedPC.benchmark.gaming = this.calcBenchmark('gaming')
      this.selectedPC.benchmark.work = this.calcBenchmark('work')
      // 入力されたパーツをリストに保存する
      this.selectedPCs.push(this.selectedPC)
      // 入力値を初期値にリセットする
      this.selectedPC = JSON.parse(JSON.stringify(initSelectedPC))
    },
    calcBenchmark(type){
      let benchmark = 0
      if (type === 'gaming') {
        benchmark =
          this.cpu[this.selectedPC.cpu.brand][this.selectedPC.cpu.model] * 0.25 +
          this.gpu[this.selectedPC.gpu.brand][this.selectedPC.gpu.model] * 0.6 +
          this.ram[this.selectedPC.ram.slot][this.selectedPC.ram.brand][this.selectedPC.ram.model] * 0.125 +
          this.storage[this.selectedPC.storage.type][this.selectedPC.storage.size][this.selectedPC.storage.brand][this.selectedPC.storage.model] * 0.025
      } else {
        benchmark =
          this.cpu[this.selectedPC.cpu.brand][this.selectedPC.cpu.model] * 0.6 +
          this.gpu[this.selectedPC.gpu.brand][this.selectedPC.gpu.model] * 0.25 +
          this.ram[this.selectedPC.ram.slot][this.selectedPC.ram.brand][this.selectedPC.ram.model] * 0.1 +
          this.storage[this.selectedPC.storage.type][this.selectedPC.storage.size][this.selectedPC.storage.brand][this.selectedPC.storage.model] * 0.05
      }
      return Math.floor(benchmark)
    },
    // 各typeで使用するselectの選択肢を作成する。
    // 例えば、type=cpu or gpuの場合は、以下のようなObjectを生成する。
    // {'Brand': {'Model': 'Baseline'}}
    createOptions(type, targetObject, attributes, func) {
      fetch(config.url + type)
        .then(response => response.json())
        .then(data => {
          let hashmap = new Object();

          for (const elem of data) {
            // 引数funcが入力された場合は、funcを使用してelemから新しいフィールドを作成する
            if (func !== undefined) {
              elem[attributes[0]] = func(elem)
            }
            if (!hashmap[elem[attributes[0]]]) {
              hashmap[elem[attributes[0]]] = elem[attributes[0]]
              targetObject[elem[attributes[0]]] = new Object()
            }
            let newTargetObject = targetObject[elem[attributes[0]]]
            for (let i=1; i<attributes.length-2; i++) {
              if (!newTargetObject[elem[attributes[i]]]) {
                newTargetObject[elem[attributes[i]]] = new Object()
              }
              newTargetObject = newTargetObject[elem[attributes[i]]]
            }
            newTargetObject[elem[attributes.slice(-2)[0]]] = elem[attributes.slice(-1)[0]]
          }
        })
    },
    getSlot(elem) {
      return elem.Model.split(' ').slice(-1)[0].split('x')[0]
    },
    getStorageSize(elem) {
      let model = elem.Model
      if (model.includes('(') && model.includes(')')) {
        model = model.split(' (')[0]
      }
      return model.split(' ').slice(-1)[0]
    }
  }
})

// 参考: https://reffect.co.jp/vue/vue-js-input-v-model#Vue_3-2
app.component('select-attribute', {
  props: ['attribute', 'options', 'modelValue'],
  template:`
    <div class="col-3">
      <div class="input-group">
        <label class="input-group-text">{{ attribute }}</label>
        <select v-on:change="onSelectChanged" v-bind:value="modelValue" class="form-select" required>
          <option value="" selected>Choose...</option>
          <option v-for="(value, key) in options" v-bind:value="key">
            {{ key }}
          </option>
        </select>
        <div class="invalid-feedback">
          Please select the {{ attribute }}.
        </div>
      </div>
    </div>
  `,
  methods: {
    onSelectChanged(event) {
      this.$emit('update:modelValue', event.target.value)
    }
  }
})

app.component('pc-card', {
  props: ['index', 'selectedPC'],
  template: `
    <div class="card text-white bg-secondary border-dark m-2" style="width: 32rem;">
      <div class="card-header">
        <h2 class="text-center">Your Computer {{ index }}</h2>
      </div>
      <div class="card-body px-5">
        <div class="card-text">
          <h3>CPU <i class="fa-solid fa-microchip"></i></h3>
          <h5>Brand: {{ selectedPC.cpu.brand }}</h5>
          <h5>Model: {{ selectedPC.cpu.model }}</h5>
          <h3>GPU <i class="fa-solid fa-microchip"></i></h3>
          <h5>Brand: {{ selectedPC.gpu.brand }}</h5>
          <h5>Model: {{ selectedPC.gpu.model }}</h5>
          <h3>RAM <i class="fa-solid fa-memory"></i></h3>
          <h5>Brand: {{ selectedPC.ram.brand }}</h5>
          <h5>Model: {{ selectedPC.ram.model }}</h5>
          <h3>Storage <i class="fa-solid fa-hard-drive"></i></h3>
          <h5>Disk: {{ selectedPC.storage.type }}</h5>
          <h5>Size: {{ selectedPC.storage.size }}</h5>
          <h5>Brand: {{ selectedPC.storage.brand }}</h5>
          <h5>Model: {{ selectedPC.storage.model }}</h5>
          <h3>Gaming <i class="fa-solid fa-gamepad"></i></h3>
          <h5>{{ selectedPC.benchmark.gaming }}%</h5>
          <h3>Work <i class="fa-solid fa-briefcase"></i></h3>
          <h5>{{ selectedPC.benchmark.work }}%</h5>
        </div>
      </div>
    </div>
  `
})

app.mount('#app')