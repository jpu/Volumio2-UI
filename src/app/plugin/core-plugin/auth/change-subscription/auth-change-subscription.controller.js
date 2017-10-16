class AuthChangeSubscriptionController {
  constructor($scope, $state, $stateParams, $q, authService, paymentsService, StripeCheckout, modalService, productsService,$filter) {
    this.$scope = $scope;
    this.$state = $state;
    this.$stateParams = $stateParams;
    this.$q = $q;
    this.modalService = modalService;
    this.paymentsService = paymentsService;
    this.authService = authService;
    this.stripeCheckout = StripeCheckout;
    this.productsService = productsService;
    this.filteredTranslate = $filter('translate');

    this.openedModal = {};

    this.user = null;
    this.product = null;

    this.init();
  }

  init() {
    this.loadProduct();
    this.authInit();
  }

  loadProduct() {
    var plan = this.$stateParams['plan'];
    this.product = this.productsService.getProductByCode(plan);
  }

  authInit() {
    this.authService.getUserPromise().then((user) => {
      this.postAuthInit(user);
      this.authService.bindWatcher(this.getAuthWatcher());
    }).catch((error) => {
      this.modalService.openDefaultErrorModal(error);
    });
  }

  getAuthWatcher() {
    return (user) => {
      this.postAuthInit(user);
    };
  }

  postAuthInit(user) {
    this.setUser(user);
  }

  setUser(user) {
    this.user = user;
  }

  changePlan() {
    if (this.user.subscriptionId === undefined || this.user.subscriptionId === null) {
      this.modalService.openDefaultErrorModal("AUTH.ERROR_CHANGE_PLAN_NO_PREVIOUS_PLAN_FOUND");
      return;
    }
    if (this.product === undefined || this.product === null || this.product.planCode === undefined) {
      this.modalService.openDefaultErrorModal("AUTH.ERROR_CHANGE_PLAN_NO_PLAN_SELECTED");
      return;
    }
    this.updateCallback(this.paymentsService.updateSubscription(this.product.planCode, this.user.uid));
  }

  updateCallback(cancelling) {
    this.openUpdatingModal();
    cancelling.then((status) => {
      this.closeUpdatingModal();
      if (status === true) {
        this.goToUpdatingSuccess();
        return;
      }
      this.goToUpdatingFail();
    }).catch((error) => {
      this.modalService.openDefaultErrorModal(error,()=>{
        this.closeUpdatingModal();
        this.goToUpdatingFail();
      });
    });
  }

  openUpdatingModal() {
    let
            templateUrl = 'app/plugin/core-plugin/auth/modals/auth-paying-modal/auth-paying-modal.html',
            controller = 'AuthPayingModalController',
            params = {
              title: this.filteredTranslate('AUTH.PAYING')
            };
    this.openedModal = this.modalService.openModal(
            controller,
            templateUrl,
            params,
            'md');
  }

  closeUpdatingModal() {
    this.openedModal.close();
  }

  goToUpdatingSuccess() {
    this.$state.go('volumio.auth.payment-success');
  }

  goToUpdatingFail() {
    this.$state.go('volumio.auth.payment-fail');
  }

  logIn() {
    this.$state.go('volumio.auth.login');
  }

  goToPlans() {
    this.$state.go('volumio.auth.plans');
  }
  
  getCurrentPlanName() {
    return this.user.plan;
  }

}

export default AuthChangeSubscriptionController;