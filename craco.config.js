module.exports = {
  webpack: {
    configure: {
      ignoreWarnings: [
        function ignoreSourceMapsLoaderWarnings(warning) {
          return (
            warning.module &&
            warning.module.resource.includes('html5-qrcode') &&
            warning.details &&
            warning.details.includes('source-map-loader')
          );
        },
      ],
    },
  },
};
