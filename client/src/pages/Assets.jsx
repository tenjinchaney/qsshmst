import { useEffect, useState } from 'react';
import { getAssets } from '../services/api';

function Assets() {
  const [assets, setAssets] = useState([]);

  useEffect(() => {
    getAssets().then((result) => {
      setAssets(result.data || []);
    });
  }, []);

  return (
    <section>
      <h2>器材管理</h2>
      {assets.map((asset) => (
        <div key={asset.id}>
          {asset.name} - {asset.status}
        </div>
      ))}
    </section>
  );
}

export default Assets;
