"""
ML Credit Scoring — Default Probability Model
Dataset: LendingClub (Kaggle) or synthetic fallback
Output: ml/model.pkl (scikit-learn pipeline, predict_proba compatible)

Usage:
  python3 train.py                  # uses synthetic data if no CSV provided
  python3 train.py --data path.csv  # use LendingClub CSV
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report, roc_auc_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import VotingClassifier

FEATURE_COLS = [
    'loan_amount',
    'loan_term_months',
    'annual_revenue',
    'ebitda',
    'existing_debt',
    'total_assets',
    'debt_to_equity',
    'dscr',
    'revenue_to_loan',
    'years_in_operation',
]


def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    """Compute derived ratio features."""
    equity = df['total_assets'] - df['existing_debt']
    df['debt_to_equity'] = df['existing_debt'] / equity.clip(lower=1)
    annual_ds = df.get('annual_debt_service', df['existing_debt'] * 0.15)
    df['dscr'] = df['ebitda'] / annual_ds.clip(lower=1)
    df['revenue_to_loan'] = df['annual_revenue'] / df['loan_amount'].clip(lower=1)
    return df


def load_lendingclub(path: str) -> tuple[pd.DataFrame, pd.Series]:
    """
    Load and map LendingClub columns to our feature schema.
    Expects the accepted_2007_to_2018Q4.csv or similar.
    """
    print(f"Loading LendingClub data from {path}…")
    df = pd.read_csv(path, low_memory=False, nrows=200_000)

    # Target: loan_status — 'Charged Off' / 'Default' = 1 (default)
    df = df[df['loan_status'].isin(['Fully Paid', 'Charged Off', 'Default'])].copy()
    y = (df['loan_status'].isin(['Charged Off', 'Default'])).astype(int)

    # Map LendingClub columns → our schema
    df['loan_amount'] = pd.to_numeric(df.get('loan_amnt', df.get('funded_amnt', 0)), errors='coerce').fillna(0)
    df['loan_term_months'] = df.get('term', '36 months').str.extract(r'(\d+)').astype(float).fillna(36)
    df['annual_revenue'] = pd.to_numeric(df.get('annual_inc', 0), errors='coerce').fillna(0)
    # Approximate EBITDA as 20% of annual income for individuals / self-employed
    df['ebitda'] = df['annual_revenue'] * 0.20
    df['existing_debt'] = pd.to_numeric(df.get('total_bal_ex_mort', df.get('open_acc', 0)), errors='coerce').fillna(0)
    df['total_assets'] = df['annual_revenue'] * 2  # rough proxy
    df['annual_debt_service'] = pd.to_numeric(df.get('installment', 0), errors='coerce').fillna(0) * 12
    df['years_in_operation'] = pd.to_numeric(df.get('emp_length', '3 years').str.extract(r'(\d+)')[0], errors='coerce').fillna(3)

    df = engineer_features(df)
    X = df[FEATURE_COLS].fillna(0).clip(-10, 1e9)
    return X, y


def generate_synthetic(n: int = 10_000, seed: int = 42) -> tuple[pd.DataFrame, pd.Series]:
    """Generate synthetic but plausible loan data for demo/fallback."""
    rng = np.random.default_rng(seed)
    print(f"Generating {n} synthetic samples…")

    loan_amount = rng.uniform(10_000, 2_000_000, n)
    loan_term_months = rng.choice([12, 24, 36, 48, 60], n)
    annual_revenue = rng.uniform(100_000, 10_000_000, n)
    ebitda_margin = rng.uniform(-0.05, 0.35, n)
    ebitda = annual_revenue * ebitda_margin
    existing_debt = rng.uniform(0, annual_revenue * 2, n)
    total_assets = existing_debt + rng.uniform(50_000, 5_000_000, n)
    years_in_operation = rng.integers(1, 30, n).astype(float)

    df = pd.DataFrame({
        'loan_amount': loan_amount,
        'loan_term_months': loan_term_months,
        'annual_revenue': annual_revenue,
        'ebitda': ebitda,
        'existing_debt': existing_debt,
        'total_assets': total_assets,
        'years_in_operation': years_in_operation,
    })
    df = engineer_features(df)

    # Default probability increases with D/E, decreases with DSCR and years
    log_odds = (
        -2.0
        + 0.4 * df['debt_to_equity'].clip(-5, 10)
        - 0.6 * df['dscr'].clip(-5, 5)
        - 0.05 * years_in_operation
        + rng.normal(0, 0.5, n)
    )
    p_default = 1 / (1 + np.exp(-log_odds))
    y = (rng.uniform(0, 1, n) < p_default).astype(int)

    X = df[FEATURE_COLS].fillna(0).clip(-10, 1e9)
    return X, pd.Series(y)


def train(X: pd.DataFrame, y: pd.Series) -> Pipeline:
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

    lr = LogisticRegression(max_iter=500, C=0.5, random_state=42)
    gb = GradientBoostingClassifier(n_estimators=100, max_depth=4, learning_rate=0.1, random_state=42)

    ensemble = VotingClassifier(
        estimators=[('lr', lr), ('gb', gb)],
        voting='soft',
        weights=[1, 2],
    )

    pipeline = Pipeline([
        ('scaler', StandardScaler()),
        ('model', ensemble),
    ])

    print("Training ensemble (LogisticRegression + GradientBoosting)…")
    pipeline.fit(X_train, y_train)

    y_pred = pipeline.predict(X_test)
    y_prob = pipeline.predict_proba(X_test)[:, 1]
    auc = roc_auc_score(y_test, y_prob)

    print(f"\nAUC-ROC: {auc:.4f}")
    print(classification_report(y_test, y_pred, target_names=['No Default', 'Default']))

    metrics = {'auc_roc': round(auc, 4), 'n_train': len(X_train), 'n_test': len(X_test)}
    (Path(__file__).parent / 'metrics.json').write_text(json.dumps(metrics, indent=2))
    print("Metrics saved to ml/metrics.json")

    return pipeline


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--data', type=str, default=None, help='Path to LendingClub CSV')
    parser.add_argument('--n', type=int, default=10_000, help='Synthetic sample count')
    args = parser.parse_args()

    if args.data:
        X, y = load_lendingclub(args.data)
    else:
        X, y = generate_synthetic(n=args.n)

    model = train(X, y)

    out_path = Path(__file__).parent / 'model.pkl'
    joblib.dump(model, out_path)
    print(f"\nModel saved to {out_path}")


if __name__ == '__main__':
    main()
