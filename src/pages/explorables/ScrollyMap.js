import React, { PureComponent } from 'react'
import { withStyles, withTheme } from '@material-ui/core/styles'
import { Scrollama, Step } from 'react-scrollama'
import dynamic from 'next/dynamic'
import { WebMercatorViewport, Marker } from 'react-map-gl'
import RegionTooltip from './RegionTooltip'

const Map = dynamic(
  () => import('@datenguide/explorables').then(({ Map }) => Map),
  { ssr: false }
)

const ShapeLayer = dynamic(
  () => import('@datenguide/explorables').then(({ ShapeLayer }) => ShapeLayer),
  { ssr: false }
)

const bounds = [
  [5.8663, 50.3226],
  [9.4617, 52.5315],
]

const layerOptions = {
  choropleth: [
    {
      type: 'fill',
      paint: {
        'fill-color': [
          'interpolate',
          ['linear'],
          ['get', 'alter'],
          43,
          '#06617C',
          45,
          '#C3E5F1',
        ],
        'fill-opacity': 0.5,
      },
    },
    {
      type: 'line',
      paint: {
        'line-color': '#004443',
        'line-opacity': 0.4,
        'line-width': 2,
      },
    },
    {
      filter: ['==', 'AGS', '05962004'],
      paint: {
        'fill-color': '#ff0000',
        'fill-opacity': 0.8,
      },
    },
  ],
  municipalities: [
    {
      paint: {
        'fill-color': '#004443',
        'fill-opacity': 0.1,
        'fill-outline-color': '#004443',
      },
    },
    {
      type: 'line',
      paint: {
        'line-color': '#004443',
        'line-opacity': 1,
        'line-width': 1,
      },
    },
    {
      filter: ['==', 'GEN', 'Köln'],
      paint: {
        'fill-color': '#004443',
        'fill-opacity': 0.8,
      },
    },
    {
      filter: ['==', 'GEN', 'Dahlem'],
      paint: {
        'fill-color': '#004443',
        'fill-opacity': 0.8,
      },
    },
  ],
  municipalitiesHighlight: {
    filter: ['==', 'GEN', 'Altena'],
    paint: {
      'fill-color': '#004443',
      'fill-opacity': 0.8,
    },
  },
}

const styles = (theme) => ({
  main: {
    padding: '2em 0',
    position: 'relative',
  },
  map: {
    position: 'sticky',
    width: '100%',
    height: '100vh',
    padding: '0',
    top: '3em',
    left: 0,
    alignSelf: 'flex-start',
    backgroundColor: '#aaa',
  },
  scroller: {
    position: 'relative',
    top: '-100vh',
    marginBottom: '-100vh',

    [theme.breakpoints.up('md')]: {
      width: '50%',
    },

    [theme.breakpoints.up('lg')]: {
      width: '40%',
    },
  },
  step: {
    opacity: 0.4,
    transition: 'opacity 300ms',
    padding: 20,
    marginBottom: '66vh',
  },
  stepInner: {
    background: 'white',
    padding: '1rem',

    '& img': {
      width: '100%',
    },
  },

  mapText: {
    width: '200px',
    position: 'relative',
    left: '-100px',
    textAlign: 'center',
  },

  mapTextValue: {
    fontSize: 60,
    display: 'block',
  },
})

function getOffset(width, { values }) {
  if (width > values.md) return width / 2
  if (width > values.lg) return width / 3
  return 0
}

function computeViewport(bounds, breakpoints) {
  if (!process.browser) return {} // In SSR, it is not possible to compute the viewport
  const { clientWidth, clientHeight } = document.documentElement
  const offset = getOffset(clientWidth, breakpoints)
  return new WebMercatorViewport({
    width: clientWidth,
    height: clientHeight,
  }).fitBounds(bounds, {
    padding: {
      top: 20,
      left: offset,
      right: -offset,
      bottom: 20,
    },
  })
}

class ScrollyMapComponent extends PureComponent {
  state = {
    viewport: computeViewport(bounds, this.props.theme.breakpoints),
    settings: {
      dragPan: false,
      dragRotate: false,
      scrollZoom: false,
      touchZoom: false,
      touchRotate: false,
      keyboard: false,
      doubleClickZoom: false,
      mapStyle: 'mapbox://styles/datenguide/cka2hksel3jxf1iobq6rxka0l',
      mapboxApiAccessToken: process.env.MAPBOX_TOKEN,
    },
  }

  handleStepEnter = ({ element, data }) => {
    element.style.opacity = 0.9
    this.setState({ currentStep: data })
  }

  handleStepExit = ({ element }) => {
    element.style.opacity = 0.4
  }

  updateDimensions = () => {
    const { breakpoints } = this.props.theme
    this.setState({ viewport: computeViewport(bounds, breakpoints) })
  }

  componentDidMount() {
    window.addEventListener('resize', this.updateDimensions)
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.updateDimensions)
  }

  render() {
    const { currentStep = '', viewport, settings } = this.state
    const { children, classes } = this.props

    return (
      <div className={classes.main}>
        <div className={classes.map}>
          <Map
            viewport={viewport}
            settings={settings}
            onViewportChange={(viewport) => this.setState({ viewport })}
          >
            <h1 style={{ textAlign: 'right' }}>{currentStep}</h1>

            {currentStep === 'nuts1' && (
              <Marker longitude={7.65708} latitude={51.6146}>
                <div className={classes.mapText}>
                  <b>Durchschnittsalter</b>
                  <span className={classes.mapTextValue}>44,1</span>
                </div>
              </Marker>
            )}

            <ShapeLayer
              src="/geo/bundeslaender.json"
              options={layerOptions.choropleth}
              hidden={currentStep !== 'nuts1'}
            />

            <ShapeLayer
              src="/geo/nrw_regierungsbezirke.json"
              options={layerOptions.choropleth}
              hidden={currentStep !== 'nuts2'}
            />

            <ShapeLayer
              src="/geo/nrw_landkreise.json"
              options={layerOptions.choropleth}
              hidden={currentStep !== 'nuts3'}
            />

            <ShapeLayer
              src="/geo/nrw_gemeinden.json"
              options={layerOptions.choropleth}
              hidden={currentStep !== 'lau'}
            />

            <ShapeLayer
              src="/geo/nrw_gemeinden.json"
              options={layerOptions.municipalities}
              hidden={currentStep !== 'lau'}
            />

            {currentStep === 'lau-local' && (
              <RegionTooltip lonLat={[7.672, 51.281]} title="Altena" />
            )}

            <ShapeLayer
              src="/geo/nrw_gemeinden.json"
              options={layerOptions.municipalitiesHighlight}
              hidden={currentStep !== 'lau-local'}
            />
          </Map>
        </div>
        <div className={classes.scroller}>
          {process.browser && (
            <Scrollama
              onStepEnter={this.handleStepEnter}
              onStepExit={this.handleStepExit}
              offset={0.7}
            >
              {React.Children.map(children, (child, i) => (
                <Step data={child.props.id} key={i}>
                  <div className={classes.step}>{child}</div>
                </Step>
              ))}
            </Scrollama>
          )}
        </div>
      </div>
    )
  }
}

export const ScrollyMapStep = withStyles(styles)(({ classes, children }) => (
  <div className={classes.stepInner}>{children}</div>
))

export const ScrollyMap = withTheme(withStyles(styles)(ScrollyMapComponent))
