import { inject as service } from '@ember/service';
import layout from './template';
import {
  computed, get, setProperties, set, observer
} from '@ember/object';
import Metrics from 'shared/mixins/metrics';
import { next } from '@ember/runloop';
import { alias } from '@ember/object/computed';
import NodesReservation from 'global-admin/components/cluster-nodes-reservation/component';
import { formatSi, exponentNeeded, parseSi } from 'shared/utils/parse-unit';

const CPU_GRAPH_TITLE = 'cluster-cpu-usage'
const MOMORY_GRAPH_TITLE = 'cluster-memory-usage'

export default NodesReservation.extend(Metrics, {
  intl:  service(),
  scope: service(),

  layout,

  nodes:             null,
  filters:           { resourceType: 'cluster' },
  isGotMetrics:      false,

  cluster:           null,

  isMonitoringReady: alias('cluster.isMonitoringReady'),

  init() {
    this._super(...arguments);
    next(() => {
      setProperties(get(this, 'state'), {
        from:     'now-5s',
        interval: '5s',
        isCustom: false,
        loading:  false,
        noGraphs: false,
        to:       'now',
      })

      this.fetchMetrics();
    });
  },

  isMonitoringReadyChange: observer('isMonitoringReady', function() {
    if ( get(this, 'isMonitoringReady') ) {
      this.fetchMetrics();
    } else {
      set(this, 'isGotMetrics', false);
    }
  }),

  graphChange: observer('graphs.[]', function() {
    const { graphs = [] } = this
    const filtered = graphs.filter((o) => o.graph.title === CPU_GRAPH_TITLE || o.graph.title === MOMORY_GRAPH_TITLE)

    if (filtered.length === 2) {
      set(this, 'isGotMetrics', true)
    } else {
      set(this, 'isGotMetrics', false)
    }
  }),

  cpuTotalPercentOb: observer('cpuUsedTotal', 'cpuReservation.subtitle', function() {
    next(() => {
      const reservation = this.getTotal(this.getNodes('cpu'))
      const used = get(this, 'cpuUsedTotal')

      if (used === 0 || used === undefined) {
        set(this, 'cpuTotalPercent', 100)
      } else {
        if (reservation > used) {
          set(this, 'cpuTotalPercent', 100)
        } else {
          set(this, 'cpuTotalPercent', Math.round(reservation / used * 100) || 100)
        }
      }
    })
  }),

  memoryTotalPercentOb: observer('memoryUsedTotal', 'memoryTotalPercent.subtitle', function() {
    next(() => {
      const reservation = this.getTotal(this.getNodes('memory'))
      const used = get(this, 'memoryUsedTotal')

      if (used === 0 || used === undefined) {
        set(this, 'memoryTotalPercent', 100)
      } else {
        if (reservation > used) {
          set(this, 'memoryTotalPercent', 100)
        } else {
          set(this, 'memoryTotalPercent', Math.round(reservation / used * 100) || 100)
        }
      }
    })
  }),

  clusterChange: observer('cluster.id', function() {
    this.fetchMetrics();
  }),

  cpuLive: computed('graphs.[]', function() {
    if (!get(this, 'graphs')) {
      return
    }
    const cpuGraph = (get(this, 'graphs')).filter((g) => g.graph.title === CPU_GRAPH_TITLE)[0]

    if (!cpuGraph || cpuGraph === undefined) {
      return
    }

    const { series = [] } = cpuGraph
    const { nodes = [] } = this
    let out = 0

    const filtered = series.filter((s) => {
      return nodes.filter((n) => n.nodeName === s.name).length > 0
    })

    filtered.map((s) => out += (s.points[1] && s.points[1][0] || 0))

    return Math.round(out / filtered.length * 100)
  }),

  cpuTicks: computed('graphs.[]', 'nodes.[]', function() {
    if (!get(this, 'graphs') || !get(this, 'showTicks')) {
      return
    }
    const cpuGraph = (get(this, 'graphs')).filter((g) => g.graph.title === CPU_GRAPH_TITLE)[0]

    if (!cpuGraph  || cpuGraph === undefined) {
      return
    }

    const { series = [] } = cpuGraph
    const { nodes = [] } = this

    return series.filter((s) => {
      return nodes.filter((n) => n.nodeName === s.name).length > 0
    }).map((s) => {
      return {
        value: Math.round((s.points[1] && s.points[1][0] || 0) * 100),
        label: s.name,
      }
    })
  }),

  memoryTicks: computed('graphs.[]', function() {
    if (!get(this, 'graphs') || !get(this, 'showTicks')) {
      return
    }
    const memoryGraph = (get(this, 'graphs')).filter((g) => g.graph.title === MOMORY_GRAPH_TITLE)[0]

    if (!memoryGraph || memoryGraph === undefined) {
      return
    }

    const { series = [] } = memoryGraph
    const { nodes = [] } = this

    return series.filter((s) => {
      return nodes.filter((n) => n.nodeName === s.name).length > 0
    }).map((s) => {
      return {
        value: Math.round((s.points[1] && s.points[1][0] || 0) * 100),
        label: s.name,
      }
    })
  }),

  memoryLive: computed('graphs.[]', function() {
    if (!get(this, 'graphs')) {
      return
    }

    const memoryGraph = (get(this, 'graphs')).filter((g) => g.graph.title === MOMORY_GRAPH_TITLE)[0]

    if (!memoryGraph || memoryGraph === undefined) {
      return
    }

    const { series = [] } = memoryGraph
    const { nodes = [] } = this
    let out = 0

    const filtered = series.filter((s) => {
      return nodes.filter((n) => n.nodeName === s.name).length > 0
    })

    filtered.map((s) => out += (s.points[1] && s.points[1][0] || 0))

    return Math.round((out / filtered.length) * 100)
  }),

  cpuLiveTitle: computed('nodeCapcity', 'graphs.[]', 'cluster.capacity', 'intl.locale', function() {
    const { cpuLive, nodes = [] } = this

    if (!cpuLive) {
      return 'loading'
    }
    const { nodeCapcity = {}, graphs = [] } = this
    const cpuGraph = graphs.filter((g) => g.graph.title === CPU_GRAPH_TITLE)[0]

    if (!cpuGraph || cpuGraph === undefined) {
      return
    }
    const { series = [] } = cpuGraph
    let used = 0
    let total = 0

    series.filter((s) => {
      return nodes.filter((n) => n.nodeName === s.name).length > 0
    }).map((s) => {
      const capacity = nodeCapcity[s.name]

      if (!capacity) {
        return
      }
      used += parseInt(capacity.cpu) * (s.points[1] && s.points[1][0] || 0)
      total += parseInt(capacity.cpu)
    })

    total = formatSi(total, 1000, '', '', 0, exponentNeeded(total), 1)
    set(this, 'cpuUsedTotal', parseSi(total))

    return get(this, 'intl').t('clusterDashboard.liveTitle', {
      total,
      used:  formatSi(used, 1000, '', '', 0, exponentNeeded(total), 1).replace(/\s.*$/, ''),
    })
  }),

  meomoryLiveTitle: computed('nodes.@each.{memory}', 'memoryLive', 'intl.locale', function() {
    const { memoryLive, nodes = [] } = this

    if (!memoryLive) {
      return 'loading'
    }
    const { nodeCapcity = {}, graphs = [] } = this
    const graph = graphs.filter((g) => g.graph.title === MOMORY_GRAPH_TITLE)[0]

    if (!graph || graph === undefined) {
      return
    }
    const { series = [] } = graph
    let used = 0
    let total = 0

    series.filter((s) => {
      return nodes.filter((n) => n.nodeName === s.name).length > 0
    }).map((s) => {
      const capacity = nodeCapcity[s.name]

      if (!capacity) {
        return
      }
      used += parseSi(capacity.memory) * (s.points[1] && s.points[1][0] || 0)
      total += parseSi(capacity.memory)
    })

    set(this, 'memoryUsedTotal', total)

    return get(this, 'intl').t('clusterDashboard.liveTitle', {
      total: formatSi(total, 1024, 'iB', 'B', 0, exponentNeeded(total), 1),
      used:  formatSi(used, 1024, '', '', 0, exponentNeeded(total), 1).replace(/\s.*$/, ''),
    })
  }),

  nodeCapcity: computed('nodes.@each.{capacity}', function() {
    const { nodes = [] } = this
    let out = {}

    nodes.map((n) => {
      out[n.nodeName] = n.capacity
    })

    return out
  }),

  fetchMetrics() {
    if (get(this, 'isMonitoringReady')) {
      this.send('query');
    }
  },

  updateData(out) {
    const single = [];
    const graphs = [];

    out.map((item) => {
      if ((get(item, 'series') || []).find((serie) => get(serie, 'points.length') > 1)) {
        graphs.push(item);
      }
    })

    setProperties(this, {
      'state.noGraphs': get(graphs, 'length') === 0,
      graphs,
      single
    });

    const timeOutAnchor = setTimeout(() => {
      this.fetchMetrics();
    }, 30 * 1000);

    set(this, 'timeOutAnchor', timeOutAnchor);
  },

  getTotal(nodes) {
    let total = 0;

    nodes.map((node) => {
      total += node.total;
    });

    return total
  },
});
