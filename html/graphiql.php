<?php
$graphqlUrl = '/graphql.php';
?>
<!DOCTYPE html>
<html lang="en">
  <head>
    <style>
      body {
        height: 100%;
        margin: 0;
        width: 100%;
        overflow: hidden;
      }

      #graphiql {
        height: 100vh;
      }
    </style>
    <title>TLH_dig: GraphiQL</title>
    <script crossorigin src="https://unpkg.com/react@16/umd/react.development.js"></script>
    <script crossorigin src="https://unpkg.com/react-dom@16/umd/react-dom.development.js"></script>
    <script src="https://unpkg.com/graphiql/graphiql.min.js" type="application/javascript"></script>
    <link rel="stylesheet" href="https://unpkg.com/graphiql/graphiql.min.css"/>
  </head>

  <body>
    <div id="graphiql">Loading...</div>
    <script>
      function graphQLFetcher(graphQLParams, opts) {
        const {headers = {}} = opts;

        console.info(headers);

        return fetch(
          '<?php echo $graphqlUrl; ?>',
          {
            method: 'post',
            headers: {
              Accept: 'application/json',
              'Content-Type': 'application/json',
              ...headers
            },
            body: JSON.stringify(graphQLParams),
            credentials: 'omit',
          },
        ).then(function (response) {
          return response.json().catch(function () {
            return response.text();
          });
        });
      }

      ReactDOM.render(
        React.createElement(GraphiQL, {
          fetcher: graphQLFetcher,
          defaultVariableEditorOpen: true,
          headerEditorEnabled: true
        }),
        document.getElementById('graphiql'),
      );
    </script>
  </body>
</html>